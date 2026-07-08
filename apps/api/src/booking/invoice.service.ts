import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { randomBytes, randomUUID } from "node:crypto";
import { DatabaseService } from "../database/database.service.js";

export type InvoiceBookingRow = {
  id: string;
  status: string;
  service_name: string;
  frequency: string;
  duration: string | null;
  size_tier: string | null;
  addons: unknown;
  estimated_total: number | null;
  invoice_no: string | null;
};

export const paymentQrPayload = "PAYNOW-AE-MANAGEMENT-SERVICES-UEN-CLIENT-TO-CONFIRM";

@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);

  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  // Pay-after-service: confirming a booking only schedules the visit. It must NOT create an
  // invoice or ask for payment — the invoice is generated later when the service is completed.
  async confirmBookingForPayment(bookingId: string, _finalAmount?: number | string) {
    const existing = await this.database.query<{ status: string }>(
      "select status from bookings where id = $1",
      [bookingId]
    );
    const booking = existing.rows[0];

    if (!booking) {
      throw new NotFoundException("Booking was not found.");
    }

    if (booking.status !== "received" && booking.status !== "confirmed") {
      throw new BadRequestException("Only pending bookings can be confirmed.");
    }

    await this.database.query(
      `
        update bookings
        set status = 'confirmed',
            confirmed_at = coalesce(confirmed_at, now())
        where id = $1
      `,
      [bookingId]
    );

    this.logger.log(`Confirmed booking ${bookingId} (visit scheduled, no invoice yet)`);
    return { invoiceNo: null };
  }

  async completeBooking(bookingId: string, finalAmount?: number | string, options: { autoCompleted?: boolean } = {}) {
    return this.issueInvoice(bookingId, finalAmount, "completed", options);
  }

  private async issueInvoice(
    bookingId: string,
    finalAmount: number | string | undefined,
    nextStatus: "confirmed" | "completed",
    options: { autoCompleted?: boolean } = {}
  ) {
    const existing = await this.database.query<InvoiceBookingRow>(
      `
        select
          bookings.id,
          bookings.status,
          bookings.service_name,
          bookings.frequency,
          bookings.duration,
          bookings.size_tier,
          bookings.addons,
          bookings.estimated_total,
          invoices.invoice_no
        from bookings
        left join invoices on invoices.booking_id = bookings.id
        where bookings.id = $1
      `,
      [bookingId]
    );
    const booking = existing.rows[0];

    if (!booking) {
      throw new NotFoundException("Booking was not found.");
    }

    if (nextStatus === "confirmed" && booking.status !== "received" && booking.status !== "confirmed") {
      throw new BadRequestException("Only pending bookings can be confirmed for payment.");
    }

    if (nextStatus === "completed" && booking.status !== "confirmed" && booking.status !== "completed") {
      throw new BadRequestException("Only confirmed bookings can be completed.");
    }

    const amountCents = resolveInvoiceAmountCents(finalAmount, booking);
    const invoiceNo = booking.invoice_no ?? await nextInvoiceNo(this.database);
    const lineItems = buildInvoiceLineItems(booking, amountCents);

    await this.database.query("begin");
    try {
      await this.database.query(
        `
          update bookings
          set status = $4,
              payment_status = 'invoice_unpaid',
              payment_qr_payload = $2,
              confirmed_at = coalesce(confirmed_at, now()),
              auto_completed = case when $3::boolean then true else auto_completed end
          where id = $1
        `,
        [bookingId, paymentQrPayload, options.autoCompleted === true, nextStatus]
      );
      await this.database.query(
        `
          insert into invoices (id, booking_id, invoice_no, amount_cents, currency, line_items_json, public_token, status)
          values ($1, $2, $3, $4, 'SGD', $5::jsonb, $6, 'unpaid')
          on conflict (booking_id) do update
          set amount_cents = excluded.amount_cents,
              line_items_json = excluded.line_items_json,
              status = case when invoices.status = 'paid' then invoices.status else 'unpaid' end,
              paid_at = case when invoices.status = 'paid' then invoices.paid_at else null end
        `,
        [`invoice_${randomUUID()}`, bookingId, invoiceNo, amountCents, JSON.stringify(lineItems), createPublicToken()]
      );
      await this.database.query("commit");
    } catch (error) {
      await this.database.query("rollback").catch(() => undefined);
      throw error;
    }

    if (options.autoCompleted) {
      this.logger.log(`Auto-completed booking ${bookingId} and generated invoice ${invoiceNo}`);
    } else if (nextStatus === "confirmed") {
      this.logger.log(`Confirmed booking ${bookingId} and prepared payment request ${invoiceNo}`);
    }

    return { invoiceNo };
  }
}

function createPublicToken() {
  return randomBytes(18).toString("base64url");
}

function resolveInvoiceAmountCents(value: number | string | undefined, booking: InvoiceBookingRow) {
  const parsed = value === undefined || value === "" ? null : Number(value);
  const amount = parsed === null ? booking.estimated_total : parsed;

  if (amount === null || !Number.isFinite(amount) || amount <= 0) {
    throw new BadRequestException("Final invoice amount is required.");
  }

  return Math.round(amount * 100);
}

async function nextInvoiceNo(database: DatabaseService) {
  const year = new Date().getFullYear();
  const result = await database.query<{ next_no: string }>(
    `
      select 'AE-${year}-' || lpad((coalesce(max(substring(invoice_no from 9)::int), 0) + 1)::text, 4, '0') as next_no
      from invoices
      where invoice_no like $1
    `,
    [`AE-${year}-%`]
  );

  return result.rows[0]?.next_no ?? `AE-${year}-0001`;
}

function buildInvoiceLineItems(booking: InvoiceBookingRow, amountCents: number) {
  const addons = toAddonList(booking.addons);
  const addonTotal = addons.reduce((total, addon) => total + addon.price, 0);
  const serviceAmount = Math.max(0, Math.round(amountCents / 100) - addonTotal);
  const serviceDetail = booking.duration ? `${booking.duration} ${booking.frequency}` : booking.size_tier ?? booking.frequency;

  return [
    { label: booking.service_name, quantity: serviceDetail, amount: serviceAmount },
    ...addons.map((addon) => ({ label: addon.name, quantity: "Add-on", amount: addon.price }))
  ];
}

function toAddonList(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((addon): addon is { id: string; name: string; price: number } => {
      if (typeof addon !== "object" || addon === null) return false;
      const record = addon as Record<string, unknown>;
      return typeof record.id === "string" && typeof record.name === "string" && typeof record.price === "number";
    })
    .map((addon) => ({ id: addon.id, name: addon.name, price: addon.price }));
}

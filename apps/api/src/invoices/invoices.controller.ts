import { Controller, Get, Inject, NotFoundException, Param, Query } from "@nestjs/common";
import { paymentQrPayload } from "../booking/invoice.service.js";
import { DatabaseService } from "../database/database.service.js";

type PublicInvoiceRow = {
  booking_id: string;
  customer_name: string | null;
  address: string | null;
  schedule_date: Date | string | null;
  service_name: string;
  invoice_id: string;
  invoice_no: string;
  amount_cents: number;
  currency: string | null;
  line_items_json: unknown;
  status: string;
  created_at: Date | string | null;
  paid_at: Date | string | null;
};

@Controller("invoices")
export class InvoicesController {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  @Get(":invoiceNo")
  async getPublicInvoice(@Param("invoiceNo") invoiceNo: string, @Query("token") token?: string) {
    if (!token || token.length < 24) {
      throw new NotFoundException("Invoice link was not found.");
    }

    const result = await this.database.query<PublicInvoiceRow>(
      `
        select
          bookings.id as booking_id,
          bookings.customer_name,
          bookings.address,
          bookings.schedule_date,
          bookings.service_name,
          invoices.id as invoice_id,
          invoices.invoice_no,
          invoices.amount_cents,
          invoices.currency,
          invoices.line_items_json,
          invoices.status,
          invoices.created_at,
          invoices.paid_at
        from invoices
        join bookings on bookings.id = invoices.booking_id
        where invoices.invoice_no = $1 and invoices.public_token = $2
      `,
      [invoiceNo, token]
    );
    const invoice = result.rows[0];

    if (!invoice) {
      throw new NotFoundException("Invoice link was not found.");
    }

    return {
      bookingRef: invoice.booking_id,
      serviceName: invoice.service_name,
      invoice: {
        id: invoice.invoice_id,
        invoiceNo: invoice.invoice_no,
        amount: Math.round(invoice.amount_cents / 100),
        amountCents: invoice.amount_cents,
        currency: invoice.currency ?? "SGD",
        lineItems: toInvoiceLineItems(invoice.line_items_json),
        customerName: invoice.customer_name ?? "",
        address: invoice.address ?? "",
        visitDate: invoice.schedule_date ? toIsoDate(invoice.schedule_date) : null,
        status: invoice.status,
        createdAt: invoice.created_at ? toIsoString(invoice.created_at) : null,
        paidAt: invoice.paid_at ? toIsoString(invoice.paid_at) : null,
        paymentQrPayload
      }
    };
  }
}

function toInvoiceLineItems(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is { label: string; amount: number; quantity?: string } => {
        if (typeof item !== "object" || item === null) {
          return false;
        }
        const line = item as Record<string, unknown>;
        return typeof line.label === "string" && typeof line.amount === "number";
      })
    : [];
}

function toIsoString(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toIsoDate(value: Date | string) {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return value.slice(0, 10);
}

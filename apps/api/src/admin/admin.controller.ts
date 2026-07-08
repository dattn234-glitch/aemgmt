import { BadRequestException, Body, Controller, Delete, Get, Headers, Inject, Logger, NotFoundException, Param, Patch, Post, Res, ServiceUnavailableException } from "@nestjs/common";
import type { FastifyReply } from "fastify";
import { randomUUID } from "node:crypto";
import { loginAdmin, logoutAdmin, requireAdminSession } from "./admin-auth.js";
import { BookingAutoCompleteService } from "../booking/booking-auto-complete.service.js";
import { InvoiceService, paymentQrPayload } from "../booking/invoice.service.js";
import { normalizeSgPhone } from "../customer/phone.js";
import { DatabaseService } from "../database/database.service.js";

type AdminLoginRequest = {
  username?: string;
  password?: string;
};

type AdminBookingRow = {
  id: string;
  status: string;
  service_id: string;
  service_name: string;
  frequency: string;
  home_type: string;
  bedrooms: string;
  bathrooms: string;
  address: string;
  duration: string | null;
  size_tier: string | null;
  schedule_date: Date | string;
  schedule_time: string;
  addons: unknown;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  customer_user_id: string | null;
  customer_first_name: string | null;
  customer_last_name: string | null;
  customer_account_email: string | null;
  customer_account_phone: string | null;
  customer_booking_count: string | number | null;
  notes: string;
  payment_method: string;
  payment_status: string;
  payment_qr_payload: string | null;
  estimated_total: number | null;
  custom_quote: boolean;
  created_at: Date | string;
  confirmed_at: Date | string | null;
  invoice_id: string | null;
  invoice_no: string | null;
  invoice_amount_cents: number | null;
  invoice_currency: string | null;
  invoice_line_items_json: unknown;
  invoice_public_token: string | null;
  invoice_status: string | null;
  invoice_created_at: Date | string | null;
  invoice_paid_at: Date | string | null;
  auto_completed: boolean;
  due_completion: boolean;
};

type CompleteBookingRequest = {
  finalAmount?: number | string;
};

type BlockedDateRequest = {
  date?: string;
  reason?: string;
};

const paymentMethodLabels: Record<string, string> = {
  "paynow-paylah-qr": "PayNow after service"
};

@Controller("admin")
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
    @Inject(InvoiceService) private readonly invoiceService: InvoiceService,
    @Inject(BookingAutoCompleteService) private readonly autoCompleteService: BookingAutoCompleteService
  ) {}

  @Post("login")
  async login(@Body() request: AdminLoginRequest, @Res({ passthrough: true }) response: FastifyReply) {
    const result = await loginAdmin(this.database, request);

    response.header("Set-Cookie", result.cookie);

    return result.admin;
  }

  @Get("me")
  async me(@Headers("cookie") cookieHeader?: string) {
    return requireAdminSession(this.database, cookieHeader);
  }

  @Post("logout")
  async logout(@Headers("cookie") cookieHeader: string | undefined, @Res({ passthrough: true }) response: FastifyReply) {
    const cookie = await logoutAdmin(this.database, cookieHeader);

    response.header("Set-Cookie", cookie);

    return { ok: true };
  }

  @Get("bookings")
  async listBookings(@Headers("cookie") cookieHeader?: string) {
    await requireAdminSession(this.database, cookieHeader);

    try {
      const result = await this.database.query<AdminBookingRow>(`
        select
          id,
          status,
          service_id,
          service_name,
          frequency,
          home_type,
          bedrooms,
          bathrooms,
          address,
          duration,
          size_tier,
          schedule_date,
          schedule_time,
          addons,
          customer_name,
          customer_phone,
          customer_email,
          customer_user_id,
          customer_first_name,
          customer_last_name,
          customer_account_email,
          customer_account_phone,
          customer_booking_count,
          notes,
          payment_method,
          payment_status,
          payment_qr_payload,
          estimated_total,
          custom_quote,
          created_at,
          confirmed_at,
          auto_completed,
          due_completion,
          invoice_id,
          invoice_no,
          invoice_amount_cents,
          invoice_currency,
          invoice_line_items_json,
          invoice_public_token,
          invoice_status,
          invoice_created_at,
          invoice_paid_at
        from (
          select
            bookings.*,
            invoices.id as invoice_id,
            invoices.invoice_no,
            invoices.amount_cents as invoice_amount_cents,
            invoices.currency as invoice_currency,
            invoices.line_items_json as invoice_line_items_json,
            invoices.public_token as invoice_public_token,
            invoices.status as invoice_status,
            invoices.created_at as invoice_created_at,
            invoices.paid_at as invoice_paid_at,
            cu.first_name as customer_first_name,
            cu.last_name as customer_last_name,
            cu.email as customer_account_email,
            cu.phone as customer_account_phone,
            count(*) over (partition by bookings.customer_user_id) as customer_booking_count
          from bookings
          left join invoices on invoices.booking_id = bookings.id
          left join customer_users cu on cu.id = bookings.customer_user_id
        ) bookings
        order by created_at desc
        limit 100
      `);

      return {
        bookings: result.rows.map(toAdminBookingResponse)
      };
    } catch (error) {
      this.logger.error("Could not list admin bookings", error instanceof Error ? error.stack : String(error));
      throw new ServiceUnavailableException("Booking database is unavailable. Check DATABASE_URL and local PostgreSQL.");
    }
  }

  @Post("scheduler/auto-complete")
  async runAutoComplete(@Headers("cookie") cookieHeader?: string) {
    await requireAdminSession(this.database, cookieHeader);

    if (process.env.NODE_ENV === "production") {
      throw new NotFoundException("Scheduler trigger was not found.");
    }

    return this.autoCompleteService.runDueCompletions();
  }

  @Get("blocked-dates")
  async listBlockedDates(@Headers("cookie") cookieHeader?: string) {
    await requireAdminSession(this.database, cookieHeader);

    const result = await this.database.query<{ id: string; date: string; reason: string; created_at: Date | string }>(
      "select id, date::text, reason, created_at from blocked_dates order by date asc"
    );

    return { blockedDates: result.rows.map(toBlockedDateResponse) };
  }

  @Post("blocked-dates")
  async addBlockedDate(@Body() request: BlockedDateRequest, @Headers("cookie") cookieHeader?: string) {
    await requireAdminSession(this.database, cookieHeader);

    const date = asText(request.date);
    const reason = asText(request.reason);

    if (!isIsoDate(date)) {
      throw new BadRequestException("Choose a valid blocked date.");
    }

    const result = await this.database.query<{ id: string; date: string; reason: string; created_at: Date | string }>(
      `
        insert into blocked_dates (id, date, reason)
        values ($1, $2::date, $3)
        on conflict (date) do update set reason = excluded.reason
        returning id, date::text, reason, created_at
      `,
      [`blocked_${randomId()}`, date, reason || "Unavailable"]
    );

    return toBlockedDateResponse(result.rows[0]);
  }

  @Delete("blocked-dates/:id")
  async removeBlockedDate(@Param("id") id: string, @Headers("cookie") cookieHeader?: string) {
    await requireAdminSession(this.database, cookieHeader);

    const result = await this.database.query<{ id: string }>("delete from blocked_dates where id = $1 returning id", [id]);

    if (!result.rows[0]) {
      throw new NotFoundException("Blocked date was not found.");
    }

    return { ok: true };
  }

  @Patch("bookings/:id/confirm")
  async confirmBooking(@Param("id") id: string, @Headers("cookie") cookieHeader?: string) {
    await requireAdminSession(this.database, cookieHeader);

    try {
      await this.invoiceService.confirmBookingForPayment(id);

      return this.getAdminBookingById(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error("Could not confirm admin booking", error instanceof Error ? error.stack : String(error));
      throw new ServiceUnavailableException("Booking database is unavailable. Check DATABASE_URL and local PostgreSQL.");
    }
  }

  @Patch("bookings/:id/complete")
  async completeBooking(@Param("id") id: string, @Body() request: CompleteBookingRequest, @Headers("cookie") cookieHeader?: string) {
    await requireAdminSession(this.database, cookieHeader);

    try {
      await this.invoiceService.completeBooking(id, request.finalAmount);

      return this.getAdminBookingById(id);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error("Could not complete admin booking", error instanceof Error ? error.stack : String(error));
      throw new ServiceUnavailableException("Booking database is unavailable. Check DATABASE_URL and local PostgreSQL.");
    }
  }

  @Patch("invoices/:id/paid")
  async markInvoicePaid(@Param("id") id: string, @Headers("cookie") cookieHeader?: string) {
    await requireAdminSession(this.database, cookieHeader);

    try {
      const result = await this.database.query<{ booking_id: string }>(
        `
          update invoices
          set status = 'paid', paid_at = coalesce(paid_at, now())
          where id = $1
          returning booking_id
        `,
        [id]
      );
      const invoice = result.rows[0];

      if (!invoice) {
        throw new NotFoundException("Invoice was not found.");
      }

      await this.database.query("update bookings set payment_status = 'paid' where id = $1", [invoice.booking_id]);

      return this.getAdminBookingById(invoice.booking_id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error("Could not mark invoice paid", error instanceof Error ? error.stack : String(error));
      throw new ServiceUnavailableException("Booking database is unavailable. Check DATABASE_URL and local PostgreSQL.");
    }
  }

  private async getAdminBookingById(id: string) {
    const result = await this.database.query<AdminBookingRow>(
      `
        select
          bookings.*,
          null::text as customer_first_name,
          null::text as customer_last_name,
          null::text as customer_account_email,
          null::text as customer_account_phone,
          null::int as customer_booking_count,
          invoices.id as invoice_id,
          invoices.invoice_no,
          invoices.amount_cents as invoice_amount_cents,
          invoices.currency as invoice_currency,
          invoices.line_items_json as invoice_line_items_json,
          invoices.public_token as invoice_public_token,
          invoices.status as invoice_status,
          invoices.created_at as invoice_created_at,
          invoices.paid_at as invoice_paid_at
        from bookings
        left join invoices on invoices.booking_id = bookings.id
        where bookings.id = $1
      `,
      [id]
    );
    const booking = result.rows[0];

    if (!booking) {
      throw new NotFoundException("Booking was not found.");
    }

    return toAdminBookingResponse(booking);
  }
}

function toAdminBookingResponse(booking: AdminBookingRow) {
  return {
    id: booking.id,
    status: booking.status,
    serviceId: booking.service_id,
    serviceName: booking.service_name,
    frequency: booking.frequency,
    home: {
      homeType: booking.home_type,
      bedrooms: booking.bedrooms,
      bathrooms: booking.bathrooms,
      address: booking.address,
      duration: booking.duration,
      sizeTier: booking.size_tier
    },
    schedule: {
      date: toDateOnly(booking.schedule_date),
      time: booking.schedule_time
    },
    addons: toAddonList(booking.addons),
    customer: {
      name: booking.customer_name,
      phone: normalizeSgPhone(booking.customer_phone) || booking.customer_phone,
      email: booking.customer_email
    },
    customerUser: booking.customer_user_id
      ? {
          id: booking.customer_user_id,
          firstName: booking.customer_first_name ?? booking.customer_name.split(" ")[0] ?? "",
          lastName: booking.customer_last_name ?? booking.customer_name.split(" ").slice(1).join(" "),
          email: booking.customer_account_email ?? booking.customer_email,
          phone:
            normalizeSgPhone(booking.customer_account_phone ?? booking.customer_phone) ||
            (booking.customer_account_phone ?? booking.customer_phone),
          bookingCount: Number(booking.customer_booking_count ?? 1)
        }
      : null,
    notes: booking.notes,
    paymentMethod: paymentMethodLabels[booking.payment_method] ?? booking.payment_method,
    paymentStatus: booking.payment_status,
    paymentQrPayload: booking.payment_qr_payload,
    estimatedTotal: booking.estimated_total,
    customQuote: booking.custom_quote,
    createdAt: toIsoString(booking.created_at),
    confirmedAt: booking.confirmed_at ? toIsoString(booking.confirmed_at) : null,
    autoCompleted: booking.auto_completed === true,
    dueCompletion: booking.due_completion === true,
    invoice: toInvoiceSummary(booking)
  };
}

function toInvoiceSummary(booking: AdminBookingRow) {
  if (!booking.invoice_id || !booking.invoice_no || booking.invoice_amount_cents === null || !booking.invoice_status) {
    return null;
  }

  return {
    id: booking.invoice_id,
    invoiceNo: booking.invoice_no,
    amount: Math.round(booking.invoice_amount_cents / 100),
    amountCents: booking.invoice_amount_cents,
    currency: booking.invoice_currency ?? "SGD",
    lineItems: toInvoiceLineItems(booking.invoice_line_items_json),
    publicToken: booking.invoice_public_token,
    status: booking.invoice_status,
    createdAt: booking.invoice_created_at ? toIsoString(booking.invoice_created_at) : null,
    paidAt: booking.invoice_paid_at ? toIsoString(booking.invoice_paid_at) : null,
    paymentQrPayload
  };
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

function toAddonList(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isAdminAddon)
    .map((addon) => ({
      id: addon.id,
      name: addon.name,
      price: addon.price
    }));
}

function isAdminAddon(value: unknown): value is { id: string; name: string; price: number } {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const addon = value as Record<string, unknown>;

  return typeof addon.id === "string" && typeof addon.name === "string" && typeof addon.price === "number";
}

function toIsoString(value: Date | string) {
  return value instanceof Date ? value.toISOString() : value;
}

function toDateOnly(value: Date | string) {
  return value instanceof Date ? toIsoDateLocal(value) : value.slice(0, 10);
}

function toIsoDateLocal(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function toBlockedDateResponse(row: { id: string; date: string; reason: string; created_at: Date | string }) {
  return {
    id: row.id,
    date: row.date,
    reason: row.reason,
    createdAt: toIsoString(row.created_at)
  };
}

function randomId() {
  return randomUUID().slice(0, 10);
}

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return toIsoDateLocal(date) === value;
}

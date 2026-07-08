import { Body, Controller, Get, Headers, Inject, Logger, Post, Res, ServiceUnavailableException } from "@nestjs/common";
import type { FastifyReply } from "fastify";
import { DatabaseService } from "../database/database.service.js";
import {
  loginCustomer,
  logoutCustomer,
  requireCustomerSession,
  signupCustomer,
  type CustomerLoginRequest,
  type CustomerSignupRequest
} from "./customer-auth.js";

type CustomerBookingRow = {
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
  payment_status: string;
  payment_method: string;
  payment_qr_payload: string | null;
  estimated_total: number | null;
  custom_quote: boolean;
  schedule_date: Date | string;
  schedule_time: string;
  addons: unknown;
  notes: string;
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
};

const paymentMethodLabels: Record<string, string> = {
  "paynow-paylah-qr": "PayNow after service"
};

const paymentQrPayload = "PAYNOW-AE-MANAGEMENT-SERVICES-UEN-CLIENT-TO-CONFIRM";

@Controller("customer")
export class CustomerController {
  private readonly logger = new Logger(CustomerController.name);

  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  @Post("signup")
  async signup(@Body() request: CustomerSignupRequest, @Res({ passthrough: true }) response: FastifyReply) {
    const result = await signupCustomer(this.database, request);

    response.header("Set-Cookie", result.cookie);

    return result.customer;
  }

  @Post("login")
  async login(@Body() request: CustomerLoginRequest, @Res({ passthrough: true }) response: FastifyReply) {
    const result = await loginCustomer(this.database, request);

    response.header("Set-Cookie", result.cookie);

    return result.customer;
  }

  @Get("me")
  async me(@Headers("cookie") cookieHeader?: string) {
    return requireCustomerSession(this.database, cookieHeader);
  }

  @Post("logout")
  async logout(@Headers("cookie") cookieHeader: string | undefined, @Res({ passthrough: true }) response: FastifyReply) {
    const cookie = await logoutCustomer(this.database, cookieHeader);

    response.header("Set-Cookie", cookie);

    return { ok: true };
  }

  @Get("bookings")
  async listBookings(@Headers("cookie") cookieHeader?: string) {
    const customer = await requireCustomerSession(this.database, cookieHeader);

    try {
      const result = await this.database.query<CustomerBookingRow>(
        `
          select
            bookings.id,
            bookings.status,
            bookings.service_id,
            bookings.service_name,
            bookings.frequency,
            bookings.home_type,
            bookings.bedrooms,
            bookings.bathrooms,
            bookings.address,
            bookings.duration,
            bookings.size_tier,
            bookings.payment_status,
            bookings.payment_method,
            bookings.payment_qr_payload,
            bookings.estimated_total,
            bookings.custom_quote,
            bookings.schedule_date,
            bookings.schedule_time,
            bookings.addons,
            bookings.notes,
            bookings.created_at,
            bookings.confirmed_at,
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
          where bookings.customer_user_id = $1
          order by bookings.created_at desc
          limit 20
        `,
        [customer.id]
      );

      return {
        bookings: result.rows.map(toCustomerBookingResponse)
      };
    } catch (error) {
      this.logger.error("Could not list customer bookings", error instanceof Error ? error.stack : String(error));
      throw new ServiceUnavailableException("Booking database is unavailable. Check DATABASE_URL and local PostgreSQL.");
    }
  }
}

function toCustomerBookingResponse(booking: CustomerBookingRow) {
  const legacyInvoice = booking.payment_status === "qr_ready" && !booking.invoice_id;

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
    paymentStatus: legacyInvoice ? "invoice_unpaid" : booking.payment_status,
    paymentMethod: paymentMethodLabels[booking.payment_method] ?? booking.payment_method,
    paymentQrPayload: booking.invoice_id || legacyInvoice ? booking.payment_qr_payload ?? paymentQrPayload : null,
    estimatedTotal: booking.estimated_total,
    customQuote: booking.custom_quote,
    schedule: {
      date: toDateOnly(booking.schedule_date),
      time: booking.schedule_time
    },
    addons: toAddonList(booking.addons),
    notes: booking.notes,
    createdAt: toIsoString(booking.created_at),
    confirmedAt: booking.confirmed_at ? toIsoString(booking.confirmed_at) : null,
    invoice: booking.invoice_id && booking.invoice_no && booking.invoice_amount_cents !== null
      ? {
          id: booking.invoice_id,
          invoiceNo: booking.invoice_no,
          amount: Math.round(booking.invoice_amount_cents / 100),
          amountCents: booking.invoice_amount_cents,
          currency: booking.invoice_currency ?? "SGD",
          lineItems: toInvoiceLineItems(booking.invoice_line_items_json),
          publicToken: booking.invoice_public_token,
          status: booking.invoice_status ?? "unpaid",
          createdAt: booking.invoice_created_at ? toIsoString(booking.invoice_created_at) : null,
          paidAt: booking.invoice_paid_at ? toIsoString(booking.invoice_paid_at) : null,
          paymentQrPayload
        }
      : legacyInvoice
        ? {
            id: `legacy-${booking.id}`,
            invoiceNo: `Legacy ${booking.id}`,
            amount: booking.estimated_total ?? 0,
            amountCents: (booking.estimated_total ?? 0) * 100,
            currency: "SGD",
            lineItems: [{ label: booking.service_name, amount: booking.estimated_total ?? 0 }],
            status: "unpaid",
            createdAt: booking.confirmed_at ? toIsoString(booking.confirmed_at) : null,
            paidAt: null,
            paymentQrPayload: booking.payment_qr_payload ?? paymentQrPayload
          }
        : null
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
    .filter(isCustomerAddon)
    .map((addon) => ({
      id: addon.id,
      name: addon.name,
      price: addon.price
    }));
}

function isCustomerAddon(value: unknown): value is { id: string; name: string; price: number } {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const addon = value as Record<string, unknown>;

  return typeof addon.id === "string" && typeof addon.name === "string" && typeof addon.price === "number";
}

function toDateOnly(value: Date | string) {
  if (value instanceof Date) {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
  }

  return value.slice(0, 10);
}

function toIsoString(value: Date | string) {
  return value instanceof Date ? value.toISOString() : value;
}

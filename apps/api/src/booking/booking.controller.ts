import { BadRequestException, Body, ConflictException, Controller, Get, Headers, Inject, Logger, NotFoundException, Param, Post, ServiceUnavailableException } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { AvailabilityService } from "../availability/availability.service.js";
import { requireCustomerSession, type CustomerSessionUser } from "../customer/customer-auth.js";
import { normalizeSgPhone } from "../customer/phone.js";
import { DatabaseService } from "../database/database.service.js";

type BookingRequest = {
  serviceId?: string;
  serviceName?: string;
  frequency?: string;
  home?: {
    homeType?: string;
    bedrooms?: string;
    bathrooms?: string;
    address?: string;
    duration?: string;
    sizeTier?: string;
  };
  schedule?: {
    date?: string;
    time?: string;
  };
  addons?: {
    id?: string;
    name?: string;
    price?: number;
  }[];
  customer?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  notes?: string;
  paymentPreference?: string;
  estimatedTotal?: number;
  customQuote?: boolean;
};

type BookingAddon = {
  id: string;
  name: string;
  price: number;
};

type ValidatedBooking = {
  serviceId: keyof typeof serviceCatalog;
  serviceName: string;
  frequency: string;
  homeType: string;
  bedrooms: string;
  bathrooms: string;
  address: string;
  duration: string | null;
  sizeTier: string | null;
  scheduleDate: string;
  scheduleTime: string;
  addons: BookingAddon[];
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerUserId: string;
  notes: string;
  paymentMethod: keyof typeof paymentMethodLabels;
  estimatedTotal: number | null;
  customQuote: boolean;
  rawRequest: BookingRequest;
};

const serviceCatalog = {
  recurring: {
    name: "Residential Cleaning Subscription",
    frequencyOptions: ["Weekly", "Fortnightly", "One-time"]
  },
  move: {
    name: "Move-In / Move-Out Cleaning",
    frequencyOptions: ["One-time package"]
  },
  renovation: {
    name: "Post-Renovation Cleaning",
    frequencyOptions: ["One-time package"]
  }
} as const;

const homeTypes = ["HDB", "Condominium", "Landed"];
const bedroomOptions = ["Studio", "1 bedroom", "2 bedrooms", "3 bedrooms", "4 bedrooms", "5+ bedrooms"];
const bathroomOptions = ["1 bathroom", "2 bathrooms", "3 bathrooms", "4+ bathrooms"];
const durationOptions = ["3 hrs", "4 hrs"];
const sizeOptions = ["Up to 700 sq ft", "700-1,000 sq ft", "1,000-1,300 sq ft", "Above 1,300 sq ft"];
const timeSlots = ["8:00 AM", "10:30 AM", "1:00 PM", "3:30 PM", "5:00 PM"];

const addonCatalog: Record<string, BookingAddon> = {
  "kitchen-degrease": { id: "kitchen-degrease", name: "Kitchen degrease", price: 45 },
  "fridge-oven": { id: "fridge-oven", name: "Fridge or oven", price: 35 },
  "bathroom-deep-clean": { id: "bathroom-deep-clean", name: "Bathroom deep clean", price: 40 },
  "sofa-mattress": { id: "sofa-mattress", name: "Sofa or mattress extraction", price: 80 }
};

const paymentMethodLabels = {
  "paynow-paylah-qr": "PayNow after service"
} as const;

const paymentQrPayload = "PAYNOW-AE-MANAGEMENT-SERVICES-UEN-CLIENT-TO-CONFIRM";
const activeBookingMessage = "You already have an active booking. AE finishes it before a new request can be placed — check Your bookings for status.";

const rates = {
  weekly: 25,
  fortnightly: 27,
  oneTime: 30,
  weekendSurcharge: 10
};

const packageMatrix = [
  { size: "Up to 700 sq ft", moveInOut: 300, postRenovation: 380 },
  { size: "700-1,000 sq ft", moveInOut: 360, postRenovation: 420 },
  { size: "1,000-1,300 sq ft", moveInOut: 420, postRenovation: 450 },
  { size: "Above 1,300 sq ft", moveInOut: null, postRenovation: null }
] as const;

@Controller("bookings")
export class BookingController {
  private readonly logger = new Logger(BookingController.name);

  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
    @Inject(AvailabilityService) private readonly availabilityService: AvailabilityService
  ) {}

  @Post()
  async createBooking(@Body() request: BookingRequest, @Headers("cookie") cookieHeader?: string) {
    const customer = await requireCustomerSession(this.database, cookieHeader);
    const booking = validateBooking(request, customer);
    const id = `booking_${new Date().toISOString().slice(0, 10).replaceAll("-", "")}_${randomUUID().slice(0, 8)}`;

    try {
      await this.database.transaction(async (client) => {
        await client.query("select pg_advisory_xact_lock(hashtext($1))", [`${booking.scheduleDate}:${booking.scheduleTime}`]);
        const activeBooking = await client.query<{ id: string }>(
          `
            select id
            from bookings
            where customer_user_id = $1
              and not (status = 'cancelled' or payment_status = 'paid')
            limit 1
          `,
          [booking.customerUserId]
        );

        if (activeBooking.rows[0]) {
          throw new ConflictException(activeBookingMessage);
        }

        const slotAvailable = await this.availabilityService.isSlotAvailable(booking.scheduleDate, booking.scheduleTime, client);

        if (!slotAvailable) {
          throw new ConflictException("That slot was just taken — please pick another.");
        }

        await client.query(
          `
            insert into bookings (
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
              notes,
              payment_method,
              payment_status,
              customer_user_id,
              estimated_total,
              custom_quote,
              raw_request
            )
            values (
              $1, 'received', $2, $3, $4, $5, $6, $7, $8, $9, $10,
              $11::date, $12, $13::jsonb, $14, $15, $16, $17, $18,
              'none', $19, $20, $21, $22::jsonb
            )
          `,
          [
            id,
            booking.serviceId,
            booking.serviceName,
            booking.frequency,
            booking.homeType,
            booking.bedrooms,
            booking.bathrooms,
            booking.address,
            booking.duration,
            booking.sizeTier,
            booking.scheduleDate,
            booking.scheduleTime,
            JSON.stringify(booking.addons),
            booking.customerName,
            booking.customerPhone,
            booking.customerEmail,
            booking.notes,
            booking.paymentMethod,
            booking.customerUserId,
            booking.estimatedTotal,
            booking.customQuote,
            JSON.stringify(booking.rawRequest)
          ]
        );
      });
      await this.database.query("update customer_users set phone = $2 where id = $1", [booking.customerUserId, booking.customerPhone]);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }

      this.logger.error("Could not create booking", error instanceof Error ? error.stack : String(error));
      throw new ServiceUnavailableException("Booking database is unavailable. Check DATABASE_URL and local PostgreSQL.");
    }

    return {
      id,
      status: "received",
      serviceName: booking.serviceName,
      paymentStatus: "none",
      paymentMethod: paymentMethodLabels[booking.paymentMethod],
      paymentQrPayload: null,
      estimatedTotal: booking.estimatedTotal,
      customQuote: booking.customQuote,
      confirmedAt: null
    };
  }

  @Get(":id")
  async getBookingStatus(@Param("id") id: string) {
    try {
      const result = await this.database.query<{
        id: string;
        status: string;
        service_name: string;
        payment_status: string;
        payment_method: keyof typeof paymentMethodLabels;
        payment_qr_payload: string | null;
        estimated_total: number | null;
        custom_quote: boolean;
        confirmed_at: Date | null;
        invoice_id: string | null;
        invoice_no: string | null;
        invoice_amount_cents: number | null;
        invoice_currency: string | null;
        invoice_line_items_json: unknown;
        invoice_public_token: string | null;
        invoice_status: string | null;
        invoice_created_at: Date | null;
        invoice_paid_at: Date | null;
      }>(
        `
          select
            bookings.id,
            bookings.status,
            bookings.service_name,
            bookings.payment_status,
            bookings.payment_method,
            bookings.payment_qr_payload,
            bookings.estimated_total,
            bookings.custom_quote,
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
          where bookings.id = $1
        `,
        [id]
      );

      const booking = result.rows[0];

      if (!booking) {
        throw new NotFoundException("Booking was not found.");
      }

      return toBookingStatusResponse(booking);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error("Could not read booking status", error instanceof Error ? error.stack : String(error));
      throw new ServiceUnavailableException("Booking database is unavailable. Check DATABASE_URL and local PostgreSQL.");
    }
  }

}

function toBookingStatusResponse(booking: {
  id: string;
  status: string;
  service_name: string;
  payment_status: string;
  payment_method: keyof typeof paymentMethodLabels;
  payment_qr_payload: string | null;
  estimated_total: number | null;
  custom_quote: boolean;
  confirmed_at: Date | null;
  invoice_id?: string | null;
  invoice_no?: string | null;
  invoice_amount_cents?: number | null;
  invoice_currency?: string | null;
  invoice_line_items_json?: unknown;
  invoice_public_token?: string | null;
  invoice_status?: string | null;
  invoice_created_at?: Date | null;
  invoice_paid_at?: Date | null;
}) {
  const legacyInvoice = booking.payment_status === "qr_ready" && !booking.invoice_id;

  return {
    id: booking.id,
    status: booking.status,
    serviceName: booking.service_name,
    paymentStatus: legacyInvoice ? "invoice_unpaid" : booking.payment_status,
    paymentMethod: paymentMethodLabels[booking.payment_method] ?? booking.payment_method,
    paymentQrPayload: booking.invoice_id || legacyInvoice ? booking.payment_qr_payload ?? paymentQrPayload : null,
    estimatedTotal: booking.estimated_total,
    customQuote: booking.custom_quote,
    confirmedAt: booking.confirmed_at?.toISOString() ?? null,
    invoice: booking.invoice_id && booking.invoice_no && booking.invoice_amount_cents != null
      ? {
          id: booking.invoice_id,
          invoiceNo: booking.invoice_no,
          amount: Math.round(booking.invoice_amount_cents / 100),
          amountCents: booking.invoice_amount_cents,
          currency: booking.invoice_currency ?? "SGD",
          lineItems: toInvoiceLineItems(booking.invoice_line_items_json),
          publicToken: booking.invoice_public_token ?? null,
          status: booking.invoice_status ?? "unpaid",
          createdAt: booking.invoice_created_at?.toISOString() ?? null,
          paidAt: booking.invoice_paid_at?.toISOString() ?? null,
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
            createdAt: booking.confirmed_at?.toISOString() ?? null,
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

function validateBooking(input: BookingRequest, customer: CustomerSessionUser): ValidatedBooking {
  const request = (isObject(input) ? input : {}) as BookingRequest;
  const errors: Record<string, string> = {};
  const serviceId = asText(request.serviceId);
  const service = isServiceId(serviceId) ? serviceCatalog[serviceId] : null;

  if (!service) {
    errors.serviceId = "Choose a valid cleaning service.";
  }

  const frequency = asText(request.frequency);
  if (!service || !(service.frequencyOptions as readonly string[]).includes(frequency)) {
    errors.frequency = "Choose a valid service frequency.";
  }

  const home = isObject(request.home) ? request.home : {};
  const homeType = asText(home.homeType);
  const bedrooms = asText(home.bedrooms);
  const bathrooms = asText(home.bathrooms);
  const address = asText(home.address);
  const duration = asText(home.duration);
  const sizeTier = asText(home.sizeTier);

  requireOption(errors, "home.homeType", homeType, homeTypes, "Choose HDB, condominium, or landed.");
  requireOption(errors, "home.bedrooms", bedrooms, bedroomOptions, "Choose the bedroom count.");
  requireOption(errors, "home.bathrooms", bathrooms, bathroomOptions, "Choose the bathroom count.");

  if (address.length < 8) {
    errors["home.address"] = "Enter the Singapore service address.";
  }

  if (serviceId === "recurring") {
    requireOption(errors, "home.duration", duration, durationOptions, "Choose a 3 or 4 hour session.");
  } else if (service) {
    requireOption(errors, "home.sizeTier", sizeTier, sizeOptions, "Choose the home size for the package quote.");
  }

  const schedule = isObject(request.schedule) ? request.schedule : {};
  const scheduleDate = asText(schedule.date);
  const scheduleTime = asText(schedule.time);

  if (!isIsoDate(scheduleDate)) {
    errors["schedule.date"] = "Choose a valid visit date.";
  } else if (scheduleDate < toIsoDateLocal(new Date())) {
    errors["schedule.date"] = "Choose today or a future visit date.";
  }

  requireOption(errors, "schedule.time", scheduleTime, timeSlots, "Choose an arrival window.");

  const paymentMethod = asText(request.paymentPreference);
  if (!isPaymentMethod(paymentMethod)) {
    errors.paymentPreference = "Choose PayNow after service.";
  }

  const addons = validateAddons(request.addons, errors);

  if (Object.keys(errors).length > 0) {
    throw new BadRequestException({
      message: "Please fix the highlighted booking fields.",
      errors
    });
  }

  const estimate = calculateEstimate({
    serviceId: serviceId as keyof typeof serviceCatalog,
    frequency,
    duration,
    sizeTier,
    scheduleDate,
    addons
  });

  return {
    serviceId: serviceId as keyof typeof serviceCatalog,
    serviceName: serviceCatalog[serviceId as keyof typeof serviceCatalog].name,
    frequency,
    homeType,
    bedrooms,
    bathrooms,
    address,
    duration: serviceId === "recurring" ? duration : null,
    sizeTier: serviceId === "recurring" ? null : sizeTier,
    scheduleDate,
    scheduleTime,
    addons,
    customerName: customer.name,
    customerPhone: normalizeSgPhone(asText(request.customer?.phone) || customer.phone) || normalizeSgPhone(customer.phone) || customer.phone,
    customerEmail: customer.email,
    customerUserId: customer.id,
    notes: asText(request.notes),
    paymentMethod: paymentMethod as keyof typeof paymentMethodLabels,
    estimatedTotal: estimate.estimatedTotal,
    customQuote: estimate.customQuote,
    rawRequest: request
  };
}

function validateAddons(addons: BookingRequest["addons"], errors: Record<string, string>) {
  if (!Array.isArray(addons)) {
    return [];
  }

  return addons
    .map((addon, index) => {
      const id = asText(addon?.id);
      const catalogAddon = addonCatalog[id];

      if (!catalogAddon) {
        errors[`addons.${index}`] = "Choose valid booking add-ons.";
        return null;
      }

      return catalogAddon;
    })
    .filter((addon): addon is BookingAddon => Boolean(addon));
}

function calculateEstimate({
  serviceId,
  frequency,
  duration,
  sizeTier,
  scheduleDate,
  addons
}: {
  serviceId: keyof typeof serviceCatalog;
  frequency: string;
  duration: string;
  sizeTier: string;
  scheduleDate: string;
  addons: BookingAddon[];
}) {
  const addonTotal = addons.reduce((total, addon) => total + addon.price, 0);

  if (serviceId === "recurring") {
    const rate = frequency === "Fortnightly" ? rates.fortnightly : frequency === "One-time" ? rates.oneTime : rates.weekly;
    const hours = Number.parseInt(duration, 10);
    const weekendSurcharge = isWeekend(scheduleDate) ? rates.weekendSurcharge : 0;

    return {
      estimatedTotal: rate * hours + weekendSurcharge + addonTotal,
      customQuote: false
    };
  }

  const row = packageMatrix.find((item) => item.size === sizeTier) ?? packageMatrix[0];
  const packagePrice = serviceId === "move" ? row.moveInOut : row.postRenovation;

  return {
    estimatedTotal: packagePrice === null ? null : packagePrice + addonTotal,
    customQuote: packagePrice === null
  };
}

function requireOption(
  errors: Record<string, string>,
  key: string,
  value: string,
  options: readonly string[],
  message: string
) {
  if (!options.includes(value)) {
    errors[key] = message;
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isServiceId(value: string): value is keyof typeof serviceCatalog {
  return value in serviceCatalog;
}

function isPaymentMethod(value: string): value is keyof typeof paymentMethodLabels {
  return value in paymentMethodLabels;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidPhone(value: string) {
  return /^\+?\d[\d\s()-]{7,18}$/.test(value);
}

function isIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return toIsoDateLocal(date) === value;
}

function toIsoDateLocal(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function isWeekend(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const dayOfWeek = date.getDay();

  return dayOfWeek === 0 || dayOfWeek === 6;
}

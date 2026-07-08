import { BadRequestException, Body, Controller, Inject, Post } from "@nestjs/common";
import { createHash } from "node:crypto";
import { AvailabilityService, BOOKINGS_OPEN, slotKey } from "./availability.service.js";

type AvailabilityRequest = {
  postalCode?: string;
  address?: string;
  serviceId?: "recurring" | "move" | "renovation";
  frequency?: string;
  duration?: string;
  sizeTier?: string;
};

type AvailabilitySlot = {
  time: string;
  rate: number;
  total: number | null;
  available: boolean;
};

const timeSlots = ["8:00 AM", "10:30 AM", "1:00 PM", "3:30 PM", "5:00 PM"];
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

@Controller("availability")
export class AvailabilityController {
  constructor(@Inject(AvailabilityService) private readonly availabilityService: AvailabilityService) {}

  @Post("search")
  async search(@Body() request: AvailabilityRequest) {
    const postalCode = asText(request.postalCode);
    const address = asText(request.address);
    const errors: Record<string, string> = {};

    if (!/^\d{6}$/.test(postalCode)) {
      errors.postalCode = "Enter the 6-digit Singapore postal code.";
    }

    if (address.length < 8) {
      errors.address = "Enter the full service address.";
    }

    if (Object.keys(errors).length > 0) {
      throw new BadRequestException({
        message: "Please fix the highlighted availability fields.",
        errors
      });
    }

    if (!BOOKINGS_OPEN) {
      return {
        serviceable: false,
        bookingsOpen: false,
        message: "AE is finalising cleaner schedules. Chat with us on WhatsApp and we will reserve your preferred visit for launch.",
        searchId: buildSearchId(request),
        weekStart: toIsoDateLocal(new Date()),
        dates: []
      };
    }

    if (postalCode.startsWith("99")) {
      return {
        serviceable: false,
        message: "AE cannot confirm cleaner routing for this postal code yet. Chat with us and we will check manually.",
        searchId: buildSearchId(request),
        weekStart: toIsoDateLocal(new Date()),
        dates: []
      };
    }

    const dates = await buildAvailabilityDates(request, this.availabilityService);

    return {
      serviceable: true,
      message: "Cleaner availability found. Pick the visit window that best matches your home schedule.",
      searchId: buildSearchId(request),
      weekStart: dates[0]?.date ?? toIsoDateLocal(new Date()),
      dates
    };
  }
}

async function buildAvailabilityDates(request: AvailabilityRequest, availabilityService: AvailabilityService) {
  const today = startOfDay(new Date());
  const start = addDays(today, 2);
  const candidateDates = Array.from({ length: 14 }, (_, index) => toIsoDateLocal(addDays(start, index)));
  const slotAvailability = await availabilityService.getAvailabilityForSlots(candidateDates, timeSlots);
  const dates = candidateDates.slice(0, 4);

  const initialDates = buildDateRows(request, start, dates, slotAvailability);
  if (initialDates.some((date) => date.available)) {
    return initialDates;
  }

  const candidateRows = buildDateRows(request, start, candidateDates, slotAvailability);
  const nextAvailableDates = candidateRows.filter((date) => date.available).map((date) => date.date);

  if (nextAvailableDates.length === 0) {
    return initialDates;
  }

  return buildDateRows(request, start, nextAvailableDates.slice(0, 4), slotAvailability);
}

function buildDateRows(
  request: AvailabilityRequest,
  start: Date,
  dates: string[],
  slotAvailability: Awaited<ReturnType<AvailabilityService["getAvailabilityForSlots"]>>
) {
  return dates.map((isoDate) => {
    const date = parseIsoDateLocal(isoDate) ?? start;
    const surcharge = isWeekend(isoDate) ? rates.weekendSurcharge : 0;
    const rate = getRate(request, surcharge);
    const dateBlocked = timeSlots.every((time) => slotAvailability.get(slotKey(isoDate, time))?.blocked === true);
    const slots = timeSlots.map<AvailabilitySlot>((time, slotIndex) => ({
      time,
      rate,
      total: getSlotTotal(request, rate),
      available: !isUnavailable(request, isoDate, time, slotIndex) && slotAvailability.get(slotKey(isoDate, time))?.available === true
    }));

    return {
      date: isoDate,
      label: date.toLocaleDateString("en-SG", { weekday: "short", month: "short", day: "numeric" }),
      surcharge,
      blocked: dateBlocked,
      available: slots.some((slot) => slot.available),
      slots
    };
  });
}

function parseIsoDateLocal(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
}

function getRate(request: AvailabilityRequest, surcharge: number) {
  if (request.serviceId === "move" || request.serviceId === "renovation") {
    return 0;
  }

  const frequency = asText(request.frequency);
  const base = frequency === "Fortnightly" ? rates.fortnightly : frequency === "One-time" ? rates.oneTime : rates.weekly;

  return base + surcharge;
}

function getSlotTotal(request: AvailabilityRequest, rate: number) {
  if (request.serviceId === "move" || request.serviceId === "renovation") {
    const sizeTier = asText(request.sizeTier);
    const row = packageMatrix.find((item) => item.size === sizeTier) ?? packageMatrix[0];
    const packagePrice = request.serviceId === "move" ? row.moveInOut : row.postRenovation;

    return packagePrice;
  }

  const hours = Number.parseInt(asText(request.duration), 10) || 3;

  return rate * hours;
}

function isUnavailable(request: AvailabilityRequest, date: string, time: string, slotIndex: number) {
  const hash = createHash("sha1").update(`${request.postalCode}:${date}:${time}`).digest("hex");
  const bucket = Number.parseInt(hash.slice(0, 2), 16);

  return bucket % 7 === 0 || slotIndex === 4;
}

function buildSearchId(request: AvailabilityRequest) {
  return `availability_${createHash("sha1").update(JSON.stringify(request)).digest("hex").slice(0, 10)}`;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);

  return next;
}

function toIsoDateLocal(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function isWeekend(isoDate: string) {
  const date = new Date(`${isoDate}T12:00:00`);
  const day = date.getDay();

  return day === 0 || day === 6;
}

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

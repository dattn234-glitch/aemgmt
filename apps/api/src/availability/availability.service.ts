import { Inject, Injectable } from "@nestjs/common";
import type { QueryResult, QueryResultRow } from "pg";
import { DatabaseService } from "../database/database.service.js";

type Queryable = {
  query<T extends QueryResultRow = QueryResultRow>(text: string, values?: unknown[]): Promise<QueryResult<T>>;
};

const parsedSlotCapacity = Number.parseInt(process.env.SLOT_CAPACITY ?? "1", 10);
export const SLOT_CAPACITY = Number.isNaN(parsedSlotCapacity) || parsedSlotCapacity < 0 ? 1 : parsedSlotCapacity;
// Launch gate: closed by DEFAULT — every date/slot stays blocked until BOOKINGS_OPEN=true is set.
export const BOOKINGS_OPEN = (process.env.BOOKINGS_OPEN ?? "false").trim().toLowerCase() === "true" && SLOT_CAPACITY > 0;
export const activeBookingStatuses = ["received", "confirmed", "completed"] as const;

export type SlotAvailability = {
  available: boolean;
  blocked: boolean;
  bookingCount: number;
  past: boolean;
};

@Injectable()
export class AvailabilityService {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  async getAvailabilityForSlots(dates: string[], times: string[], queryable: Queryable = this.database) {
    const uniqueDates = [...new Set(dates)];
    const uniqueTimes = [...new Set(times)];
    const blockedDates = await this.getBlockedDateSet(uniqueDates, queryable);
    const bookingCounts = await this.getBookingCounts(uniqueDates, uniqueTimes, queryable);

    return new Map(
      uniqueDates.flatMap((date) =>
        uniqueTimes.map((time) => {
          const blocked = blockedDates.has(date);
          const bookingCount = bookingCounts.get(slotKey(date, time)) ?? 0;
          const past = isPastDateTime(date, time);

          return [
            slotKey(date, time),
            {
              available: BOOKINGS_OPEN && !blocked && !past && bookingCount < SLOT_CAPACITY,
              blocked,
              bookingCount,
              past
            } satisfies SlotAvailability
          ] as const;
        })
      )
    );
  }

  async isSlotAvailable(date: string, time: string, queryable: Queryable = this.database) {
    const slots = await this.getAvailabilityForSlots([date], [time], queryable);
    return slots.get(slotKey(date, time))?.available === true;
  }

  private async getBlockedDateSet(dates: string[], queryable: Queryable) {
    if (dates.length === 0) {
      return new Set<string>();
    }

    const result = await query<{ date: string }>(
      queryable,
      "select date::text from blocked_dates where date = any($1::date[])",
      [dates]
    );

    return new Set(result.rows.map((row) => row.date));
  }

  private async getBookingCounts(dates: string[], times: string[], queryable: Queryable) {
    if (dates.length === 0 || times.length === 0) {
      return new Map<string, number>();
    }

    const result = await query<{ schedule_date: string; schedule_time: string; booking_count: string }>(
      queryable,
      `
        select schedule_date::text, schedule_time, count(*)::text as booking_count
        from bookings
        where schedule_date = any($1::date[])
          and schedule_time = any($2::text[])
          and status = any($3::text[])
        group by schedule_date, schedule_time
      `,
      [dates, times, activeBookingStatuses]
    );

    return new Map(result.rows.map((row) => [slotKey(row.schedule_date, row.schedule_time), Number(row.booking_count)]));
  }
}

export function slotKey(date: string, time: string) {
  return `${date} ${time}`;
}

async function query<T extends QueryResultRow>(queryable: Queryable, text: string, values?: unknown[]) {
  return queryable.query<T>(text, values);
}

function isPastDateTime(date: string, time: string) {
  return parseSlotDateTime(date, time).getTime() <= Date.now();
}

function parseSlotDateTime(date: string, time: string) {
  const match = /^(\d{1,2}):(\d{2})\s?(AM|PM)$/i.exec(time.trim());
  const [year, month, day] = date.split("-").map(Number);

  if (!match) {
    return new Date(year, month - 1, day, 23, 59, 59);
  }

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const period = match[3].toUpperCase();

  if (period === "PM" && hour !== 12) {
    hour += 12;
  }

  if (period === "AM" && hour === 12) {
    hour = 0;
  }

  return new Date(year, month - 1, day, hour, minute);
}

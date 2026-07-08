import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { DatabaseService } from "../database/database.service.js";

const defaultIntervalMs = 10 * 60 * 1000;

// Current approved flow: request -> AE confirms visit -> service completed -> invoice with QR.
// The scheduler is intentionally a safe no-op so it cannot generate payment before completion.
@Injectable()
export class BookingAutoCompleteService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BookingAutoCompleteService.name);
  private timer: NodeJS.Timeout | null = null;
  private readonly database: DatabaseService;

  constructor(@Inject(DatabaseService) database: DatabaseService) {
    this.database = database;
  }

  onModuleInit() {
    void this.runDueCompletions();
    this.timer = setInterval(() => void this.runDueCompletions(), getIntervalMs());
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  async runDueCompletions() {
    this.logger.debug("Booking auto-complete scheduler is disabled for the pay-after-service invoice flow.");
    return { flagged: 0 };
  }
}

function getIntervalMs() {
  const value = Number(process.env.BOOKING_AUTO_COMPLETE_INTERVAL_MS);

  return Number.isFinite(value) && value > 0 ? value : defaultIntervalMs;
}

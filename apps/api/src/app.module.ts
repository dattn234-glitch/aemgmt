import { Module } from "@nestjs/common";
import { AdminController } from "./admin/admin.controller.js";
import { AuthController } from "./auth/auth.controller.js";
import { AvailabilityController } from "./availability/availability.controller.js";
import { AvailabilityService } from "./availability/availability.service.js";
import { BookingController } from "./booking/booking.controller.js";
import { BookingAutoCompleteService } from "./booking/booking-auto-complete.service.js";
import { InvoiceService } from "./booking/invoice.service.js";
import { ContactController } from "./contact/contact.controller.js";
import { ContentController } from "./content/content.controller.js";
import { ContentService } from "./content/content.service.js";
import { CustomerController } from "./customer/customer.controller.js";
import { DatabaseService } from "./database/database.service.js";
import { InvoicesController } from "./invoices/invoices.controller.js";

@Module({
  controllers: [ContentController, BookingController, ContactController, AdminController, AuthController, CustomerController, AvailabilityController, InvoicesController],
  providers: [ContentService, DatabaseService, InvoiceService, BookingAutoCompleteService, AvailabilityService]
})
export class AppModule {}

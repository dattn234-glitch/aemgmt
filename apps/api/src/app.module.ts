import { Module } from "@nestjs/common";
import { BookingController } from "./booking/booking.controller.js";
import { ContactController } from "./contact/contact.controller.js";
import { ContentController } from "./content/content.controller.js";
import { ContentService } from "./content/content.service.js";

@Module({
  controllers: [ContentController, BookingController, ContactController],
  providers: [ContentService]
})
export class AppModule {}

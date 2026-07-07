import { Body, Controller, Post } from "@nestjs/common";

type BookingRequest = {
  serviceId?: string;
  serviceName?: string;
  frequency?: string;
  home?: {
    homeType?: string;
    bedrooms?: string;
    bathrooms?: string;
    address?: string;
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
};

@Controller("bookings")
export class BookingController {
  @Post()
  createBooking(@Body() request: BookingRequest) {
    return {
      id: `booking_${Date.now()}`,
      status: "received",
      request
    };
  }
}

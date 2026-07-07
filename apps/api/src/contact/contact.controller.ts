import { Body, Controller, Post } from "@nestjs/common";

type ContactRequest = {
  serviceType?: string;
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
};

@Controller("contact")
export class ContactController {
  @Post()
  sendMessage(@Body() request: ContactRequest) {
    return {
      id: `contact_${Date.now()}`,
      status: "received",
      request
    };
  }
}

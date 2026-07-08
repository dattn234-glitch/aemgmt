import { BadRequestException, Body, Controller, Inject, Post, ServiceUnavailableException } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { DatabaseService } from "../database/database.service.js";

type ContactRequest = {
  serviceType?: string;
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
};

const serviceTypes = ["Residential cleaning subscription", "Move-in / move-out cleaning", "Post-renovation cleaning"] as const;

@Controller("contact")
export class ContactController {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  @Post()
  async sendMessage(@Body() request: ContactRequest) {
    const contact = validateContact(request);
    const id = `contact_${new Date().toISOString().slice(0, 10).replaceAll("-", "")}_${randomUUID().slice(0, 8)}`;

    try {
      await this.database.query(
        `
          insert into contact_requests (
            id,
            status,
            service_type,
            name,
            email,
            phone,
            message,
            raw_request
          )
          values ($1, 'received', $2, $3, $4, $5, $6, $7::jsonb)
        `,
        [
          id,
          contact.serviceType,
          contact.name,
          contact.email,
          contact.phone,
          contact.message,
          JSON.stringify(request)
        ]
      );
    } catch {
      throw new ServiceUnavailableException("Contact database is unavailable. Check DATABASE_URL and local PostgreSQL.");
    }

    return {
      id,
      status: "received"
    };
  }
}

function validateContact(input: ContactRequest) {
  const request = (isObject(input) ? input : {}) as ContactRequest;
  const errors: Record<string, string> = {};
  const serviceType = asText(request.serviceType);
  const name = asText(request.name);
  const email = asText(request.email);
  const phone = asText(request.phone);
  const message = asText(request.message);

  if (!serviceTypes.includes(serviceType as (typeof serviceTypes)[number])) {
    errors.serviceType = "Choose a valid service.";
  }

  if (name.length < 2) {
    errors.name = "Enter your name.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!/^\+?\d[\d\s()-]{7,18}$/.test(phone)) {
    errors.phone = "Enter a valid phone number.";
  }

  if (Object.keys(errors).length > 0) {
    throw new BadRequestException({
      message: "Please fix the highlighted contact fields.",
      errors
    });
  }

  return {
    serviceType,
    name,
    email,
    phone,
    message
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

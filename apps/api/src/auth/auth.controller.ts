import { Body, Controller, Get, Headers, Inject, Post, Res, UnauthorizedException } from "@nestjs/common";
import type { FastifyReply } from "fastify";
import { loginAdmin, logoutAdmin, requireAdminSession } from "../admin/admin-auth.js";
import { loginCustomer, logoutCustomer, requireCustomerSession, type CustomerLoginRequest } from "../customer/customer-auth.js";
import { DatabaseService } from "../database/database.service.js";

type UnifiedLoginRequest = {
  email?: string;
  password?: string;
};

@Controller("auth")
export class AuthController {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  @Post("login")
  async login(
    @Body() request: UnifiedLoginRequest,
    @Headers("cookie") cookieHeader: string | undefined,
    @Res({ passthrough: true }) response: FastifyReply
  ) {
    const email = typeof request.email === "string" ? request.email.trim() : "";
    const password = typeof request.password === "string" ? request.password : "";

    // Admin identities win when both tables ever contain the same email.
    try {
      const result = await loginAdmin(this.database, { username: email, password });
      const clearCustomerCookie = await logoutCustomer(this.database, cookieHeader);

      response.header("Set-Cookie", [result.cookie, clearCustomerCookie]);

      return { role: "admin", name: result.admin.displayName };
    } catch (error) {
      if (!(error instanceof UnauthorizedException)) {
        throw error;
      }
    }

    try {
      const result = await loginCustomer(this.database, { email, password } satisfies CustomerLoginRequest);
      const clearAdminCookie = await logoutAdmin(this.database, cookieHeader);

      response.header("Set-Cookie", [result.cookie, clearAdminCookie]);

      return { role: "customer", name: result.customer.name, customer: result.customer };
    } catch (error) {
      if (!(error instanceof UnauthorizedException)) {
        throw error;
      }
    }

    throw new UnauthorizedException("Invalid email or password.");
  }

  @Get("me")
  async me(@Headers("cookie") cookieHeader?: string) {
    try {
      const admin = await requireAdminSession(this.database, cookieHeader);

      return { role: "admin", name: admin.displayName };
    } catch (error) {
      if (!(error instanceof UnauthorizedException)) {
        throw error;
      }
    }

    try {
      const customer = await requireCustomerSession(this.database, cookieHeader);

      return { role: "customer", name: customer.name };
    } catch (error) {
      if (!(error instanceof UnauthorizedException)) {
        throw error;
      }
    }

    return { role: null, name: null };
  }
}

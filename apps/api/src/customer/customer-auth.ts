import { BadRequestException, ConflictException, UnauthorizedException } from "@nestjs/common";
import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { DatabaseService } from "../database/database.service.js";
import { isValidSgMobile, normalizeSgPhone } from "./phone.js";

export type CustomerSignupRequest = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  password?: string;
};

export type CustomerLoginRequest = {
  email?: string;
  password?: string;
};

type CustomerUserRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password_hash: string;
};

export type CustomerSessionUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  name: string;
};

const customerCookieName = "ae_customer_session";
const sessionMaxAgeSeconds = 60 * 60 * 24 * 7;

export async function signupCustomer(database: DatabaseService, request: CustomerSignupRequest) {
  const firstName = clean(request.firstName);
  const lastName = clean(request.lastName);
  const email = clean(request.email).toLowerCase();
  const phone = normalizeSgPhone(clean(request.phone));
  const password = clean(request.password);
  const errors: Record<string, string> = {};

  if (firstName.length < 2) errors.firstName = "Enter your first name.";
  if (lastName.length < 2) errors.lastName = "Enter your last name.";
  if (!isValidEmail(email)) errors.email = "Enter a valid email address.";
  if (!isValidSgMobile(phone)) errors.phone = "Enter an 8-digit Singapore WhatsApp mobile starting with 8 or 9.";
  if (password.length < 4) errors.password = "Use at least 4 characters.";

  if (Object.keys(errors).length > 0) {
    throw new BadRequestException({ message: "Please fix the highlighted account fields.", errors });
  }

  const existing = await database.query<{ id: string }>(
    "select id from customer_users where lower(email) = lower($1) limit 1",
    [email]
  );

  if (existing.rows.length > 0) {
    throw new ConflictException("An account with this email already exists.");
  }

  const id = `customer_${randomUUID()}`;

  await database.query(
    `
      insert into customer_users (id, first_name, last_name, email, phone, password_hash)
      values ($1, $2, $3, $4, $5, $6)
    `,
    [id, firstName, lastName, email, phone, createPasswordHash(password)]
  );

  const user = {
    id,
    first_name: firstName,
    last_name: lastName,
    email,
    phone,
    password_hash: ""
  };

  return createCustomerSession(database, user);
}

export async function loginCustomer(database: DatabaseService, request: CustomerLoginRequest) {
  const email = clean(request.email).toLowerCase();
  const password = clean(request.password);
  const result = await database.query<CustomerUserRow>(
    `
      select id, first_name, last_name, email, phone, password_hash
      from customer_users
      where lower(email) = lower($1)
      limit 1
    `,
    [email]
  );
  const user = result.rows[0];

  if (!user || !verifyPassword(password, user.password_hash)) {
    throw new UnauthorizedException("Invalid customer credentials.");
  }

  await database.query("update customer_users set last_login_at = now() where id = $1", [user.id]);

  return createCustomerSession(database, user);
}

export async function requireCustomerSession(database: DatabaseService, cookieHeader?: string) {
  const sessionValue = readCookie(cookieHeader, customerCookieName);

  if (!sessionValue) {
    throw new UnauthorizedException("Customer login is required.");
  }

  const sessionHash = hashSession(sessionValue);
  const result = await database.query<CustomerUserRow>(
    `
      select customer_users.id, customer_users.first_name, customer_users.last_name, customer_users.email, customer_users.phone, customer_users.password_hash
      from customer_sessions
      join customer_users on customer_users.id = customer_sessions.customer_user_id
      where customer_sessions.session_hash = $1
        and customer_sessions.expires_at > now()
      limit 1
    `,
    [sessionHash]
  );
  const user = result.rows[0];

  if (!user) {
    throw new UnauthorizedException("Customer login is required.");
  }

  await database.query("update customer_sessions set last_seen_at = now() where session_hash = $1", [sessionHash]);

  return toSessionUser(user);
}

export async function logoutCustomer(database: DatabaseService, cookieHeader?: string) {
  const sessionValue = readCookie(cookieHeader, customerCookieName);

  if (sessionValue) {
    await database.query("delete from customer_sessions where session_hash = $1", [hashSession(sessionValue)]);
  }

  return buildSessionCookie("", 0);
}

async function createCustomerSession(database: DatabaseService, user: CustomerUserRow) {
  const sessionValue = `${randomUUID()}${randomBytes(24).toString("hex")}`;
  const sessionHash = hashSession(sessionValue);

  await database.query(
    `
      insert into customer_sessions (id, customer_user_id, session_hash, expires_at, last_seen_at)
      values ($1, $2, $3, now() + ($4::int * interval '1 second'), now())
    `,
    [`customer_session_${randomUUID()}`, user.id, sessionHash, sessionMaxAgeSeconds]
  );

  return {
    cookie: buildSessionCookie(sessionValue, sessionMaxAgeSeconds),
    customer: toSessionUser(user)
  };
}

function createPasswordHash(password: string) {
  const salt = randomBytes(16).toString("hex");
  const key = scryptSync(password, salt, 64).toString("hex");

  return `scrypt$${salt}$${key}`;
}

function verifyPassword(password: string, passwordHash: string) {
  const [scheme, salt, key] = passwordHash.split("$");

  if (scheme !== "scrypt" || !salt || !key) {
    return false;
  }

  const expected = Buffer.from(key, "hex");
  const actual = scryptSync(password, salt, expected.length);

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function hashSession(sessionValue: string) {
  return createHash("sha256").update(sessionValue).digest("hex");
}

function buildSessionCookie(value: string, maxAgeSeconds: number) {
  const secure = process.env.CUSTOMER_COOKIE_SECURE === "true" ? "; Secure" : "";

  return `${customerCookieName}=${value}; HttpOnly; SameSite=Lax; Path=/api; Max-Age=${maxAgeSeconds}${secure}`;
}

function readCookie(cookieHeader: string | undefined, name: string) {
  if (!cookieHeader) {
    return "";
  }

  const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());
  const prefix = `${name}=`;
  const cookie = cookies.find((item) => item.startsWith(prefix));

  return cookie ? cookie.slice(prefix.length) : "";
}

function toSessionUser(user: CustomerUserRow): CustomerSessionUser {
  const firstName = user.first_name;
  const lastName = user.last_name;

  return {
    id: user.id,
    firstName,
    lastName,
    email: user.email,
    phone: normalizeSgPhone(user.phone) || user.phone,
    name: `${firstName} ${lastName}`.trim()
  };
}

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

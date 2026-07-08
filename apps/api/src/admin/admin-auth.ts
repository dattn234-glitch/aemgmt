import { UnauthorizedException } from "@nestjs/common";
import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { DatabaseService } from "../database/database.service.js";

type AdminLoginRequest = {
  username?: string;
  password?: string;
};

type AdminUserRow = {
  id: string;
  username: string;
  password_hash: string;
  display_name: string;
};

export type AdminSessionUser = {
  id: string;
  username: string;
  displayName: string;
};

const adminCookieName = "ae_admin_session";
const sessionMaxAgeSeconds = 60 * 60 * 24 * 7;

export async function loginAdmin(database: DatabaseService, request: AdminLoginRequest) {
  await ensureDefaultAdmin(database);

  const username = clean(request.username);
  const password = clean(request.password);
  const result = await database.query<AdminUserRow>(
    `
      select id, username, password_hash, display_name
      from admin_users
      where lower(username) = lower($1)
      limit 1
    `,
    [username]
  );
  const admin = result.rows[0];

  if (!admin || !verifyPassword(password, admin.password_hash)) {
    throw new UnauthorizedException("Invalid admin credentials.");
  }

  const sessionValue = `${randomUUID()}${randomBytes(24).toString("hex")}`;
  const sessionHash = hashSession(sessionValue);

  await database.query(
    `
      insert into admin_sessions (id, admin_user_id, session_hash, expires_at, last_seen_at)
      values ($1, $2, $3, now() + ($4::int * interval '1 second'), now())
    `,
    [`admin_session_${randomUUID()}`, admin.id, sessionHash, sessionMaxAgeSeconds]
  );
  await database.query("update admin_users set last_login_at = now() where id = $1", [admin.id]);

  return {
    cookie: buildSessionCookie(sessionValue, sessionMaxAgeSeconds),
    admin: toSessionUser(admin)
  };
}

export async function requireAdminSession(database: DatabaseService, cookieHeader?: string) {
  const sessionValue = readCookie(cookieHeader, adminCookieName);

  if (!sessionValue) {
    throw new UnauthorizedException("Admin login is required.");
  }

  const result = await database.query<AdminUserRow>(
    `
      select admin_users.id, admin_users.username, admin_users.password_hash, admin_users.display_name
      from admin_sessions
      join admin_users on admin_users.id = admin_sessions.admin_user_id
      where admin_sessions.session_hash = $1
        and admin_sessions.expires_at > now()
      limit 1
    `,
    [hashSession(sessionValue)]
  );
  const admin = result.rows[0];

  if (!admin) {
    throw new UnauthorizedException("Admin login is required.");
  }

  await database.query("update admin_sessions set last_seen_at = now() where session_hash = $1", [hashSession(sessionValue)]);

  return toSessionUser(admin);
}

export async function logoutAdmin(database: DatabaseService, cookieHeader?: string) {
  const sessionValue = readCookie(cookieHeader, adminCookieName);

  if (sessionValue) {
    await database.query("delete from admin_sessions where session_hash = $1", [hashSession(sessionValue)]);
  }

  return buildSessionCookie("", 0);
}

async function ensureDefaultAdmin(database: DatabaseService) {
  const username = process.env.ADMIN_USERNAME ?? "admin@interisland.com";
  const password = process.env.ADMIN_PASSWORD ?? "1111";
  const displayName = process.env.ADMIN_DISPLAY_NAME ?? "AE Admin";
  const existing = await database.query<{ id: string }>(
    "select id from admin_users where lower(username) = lower($1) limit 1",
    [username]
  );

  if (existing.rows.length > 0) {
    await database.query(
      "update admin_users set password_hash = $2, display_name = $3 where lower(username) = lower($1)",
      [username, createPasswordHash(password), displayName]
    );
    return;
  }

  try {
    await database.query(
      `
        insert into admin_users (id, username, password_hash, display_name)
        values ($1, $2, $3, $4)
      `,
      [`admin_${randomUUID()}`, username, createPasswordHash(password), displayName]
    );
  } catch {
    // Another request may have seeded the default admin first.
  }
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
  const secure = process.env.ADMIN_COOKIE_SECURE === "true" ? "; Secure" : "";

  return `${adminCookieName}=${value}; HttpOnly; SameSite=Lax; Path=/api; Max-Age=${maxAgeSeconds}${secure}`;
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

function toSessionUser(admin: AdminUserRow): AdminSessionUser {
  return {
    id: admin.id,
    username: admin.username,
    displayName: admin.display_name
  };
}

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

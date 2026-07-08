import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { randomBytes } from "node:crypto";
import { Pool, type PoolClient, type PoolConfig, type QueryResult, type QueryResultRow } from "pg";

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private readonly pool = new Pool(getPoolConfig());
  private schemaReady?: Promise<void>;

  async onModuleDestroy() {
    await this.pool.end();
  }

  async query<T extends QueryResultRow = QueryResultRow>(text: string, values?: unknown[]): Promise<QueryResult<T>> {
    await this.ensureSchema();
    return this.pool.query<T>(text, values);
  }

  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    await this.ensureSchema();

    const client = await this.pool.connect();

    try {
      await client.query("begin");
      const result = await callback(client);
      await client.query("commit");
      return result;
    } catch (error) {
      await client.query("rollback").catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  }

  private async ensureSchema() {
    this.schemaReady ??= this.prepareSchema().catch((error: unknown) => {
      this.schemaReady = undefined;
      throw error;
    });

    await this.schemaReady;
  }

  private async prepareSchema() {
    await this.pool.query(`
      create table if not exists bookings (
        id text primary key,
        status text not null,
        service_id text not null,
        service_name text not null,
        frequency text not null,
        home_type text not null,
        bedrooms text not null,
        bathrooms text not null,
        address text not null,
        duration text,
        size_tier text,
        schedule_date date not null,
        schedule_time text not null,
        addons jsonb not null default '[]'::jsonb,
        customer_name text not null,
        customer_phone text not null,
        customer_email text not null,
        notes text not null default '',
        payment_method text not null,
        payment_status text not null,
        payment_qr_payload text,
        confirmed_at timestamptz,
        auto_completed boolean not null default false,
        due_completion boolean not null default false,
        estimated_total integer,
        custom_quote boolean not null default false,
        raw_request jsonb not null,
        created_at timestamptz not null default now()
      );
    `);

    await this.pool.query("alter table bookings add column if not exists payment_qr_payload text;");
    await this.pool.query("alter table bookings add column if not exists confirmed_at timestamptz;");
    await this.pool.query("alter table bookings add column if not exists customer_user_id text;");
    await this.pool.query("alter table bookings add column if not exists auto_completed boolean not null default false;");
    await this.pool.query("alter table bookings add column if not exists due_completion boolean not null default false;");

    await this.pool.query(`
      create table if not exists invoices (
        id text primary key,
        booking_id text not null unique references bookings(id) on delete cascade,
        invoice_no text not null unique,
        amount_cents integer not null,
        currency text not null default 'SGD',
        line_items_json jsonb not null default '[]'::jsonb,
        public_token text,
        status text not null,
        created_at timestamptz not null default now(),
        paid_at timestamptz
      );
    `);

    await this.pool.query("alter table invoices add column if not exists public_token text;");
    await this.backfillInvoicePublicTokens();
    await this.pool.query("create index if not exists invoices_booking_id_idx on invoices(booking_id);");
    await this.pool.query("create index if not exists invoices_invoice_no_idx on invoices(invoice_no);");
    await this.pool.query("create unique index if not exists invoices_public_token_idx on invoices(public_token);");

    await this.pool.query(`
      create table if not exists contact_requests (
        id text primary key,
        status text not null,
        service_type text not null,
        name text not null,
        email text not null,
        phone text not null,
        message text not null default '',
        raw_request jsonb not null,
        created_at timestamptz not null default now()
      );
    `);

    await this.pool.query(`
      create table if not exists admin_users (
        id text primary key,
        username text not null unique,
        password_hash text not null,
        display_name text not null,
        created_at timestamptz not null default now(),
        last_login_at timestamptz
      );
    `);

    await this.pool.query(`
      create table if not exists admin_sessions (
        id text primary key,
        admin_user_id text not null references admin_users(id) on delete cascade,
        session_hash text not null unique,
        created_at timestamptz not null default now(),
        expires_at timestamptz not null,
        last_seen_at timestamptz
      );
    `);

    await this.pool.query("create index if not exists admin_sessions_hash_idx on admin_sessions(session_hash);");
    await this.pool.query("create index if not exists admin_sessions_expires_idx on admin_sessions(expires_at);");

    await this.pool.query(`
      create table if not exists customer_users (
        id text primary key,
        first_name text not null,
        last_name text not null,
        email text not null unique,
        phone text not null,
        password_hash text not null,
        created_at timestamptz not null default now(),
        last_login_at timestamptz
      );
    `);

    await this.pool.query(`
      create table if not exists customer_sessions (
        id text primary key,
        customer_user_id text not null references customer_users(id) on delete cascade,
        session_hash text not null unique,
        created_at timestamptz not null default now(),
        expires_at timestamptz not null,
        last_seen_at timestamptz
      );
    `);

    await this.pool.query("create index if not exists customer_sessions_hash_idx on customer_sessions(session_hash);");
    await this.pool.query("create index if not exists customer_sessions_expires_idx on customer_sessions(expires_at);");
    await this.pool.query("create index if not exists bookings_customer_user_id_idx on bookings(customer_user_id);");
    await this.pool.query("create index if not exists bookings_schedule_slot_idx on bookings(schedule_date, schedule_time);");

    await this.pool.query(`
      create table if not exists blocked_dates (
        id text primary key,
        date date not null unique,
        reason text not null default '',
        created_at timestamptz not null default now()
      );
    `);

    await this.pool.query("create index if not exists blocked_dates_date_idx on blocked_dates(date);");

    this.logger.log("PostgreSQL tables are ready");
  }

  private async backfillInvoicePublicTokens() {
    const invoices = await this.pool.query<{ id: string }>("select id from invoices where public_token is null or length(public_token) < 24");

    for (const invoice of invoices.rows) {
      await this.pool.query("update invoices set public_token = $2 where id = $1", [invoice.id, createPublicToken()]);
    }
  }
}

function createPublicToken() {
  return randomBytes(18).toString("base64url");
}

function getPoolConfig(): PoolConfig {
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined
    };
  }

  const config: PoolConfig = {
    host: process.env.PGHOST ?? "127.0.0.1",
    port: Number(process.env.PGPORT ?? 5432),
    database: process.env.PGDATABASE ?? "postgres"
  };

  if (process.env.PGUSER) {
    config.user = process.env.PGUSER;
  }

  if (process.env.PGPASSWORD) {
    config.password = process.env.PGPASSWORD;
  }

  return config;
}

# AE Management Services — Deployment Guide (Vercel + Railway)

The app has two runtime pieces + a database:

- **Web** (Vite/React static build) → **Vercel** (config: `vercel.json` at repo root).
- **API** (NestJS/Fastify) → **Railway** (config: `railway.json` at repo root).
- **PostgreSQL** → **Railway Postgres plugin** (same project as the API).

The web app calls the API with relative `fetch("/api/...")`. In dev, Vite proxies `/api` →
`http://127.0.0.1:3000`. In production, a **Vercel rewrite** proxies `/api/*` to the Railway API —
this keeps session cookies first-party (SameSite=Lax works as-is) and needs no CORS changes.

> Build gotcha: `npm run build:web` (vite) **wipes `dist/`**, including `dist/api`. That's fine in
> deployment because Railway only runs `build:api` and Vercel only runs `build:web` — just don't
> rely on `npm run build` locally to keep both outputs.

## 1. Railway — Postgres + API (do this first; Vercel needs the API URL)

1. railway.com → **New Project** → **Deploy from GitHub repo** (push this repo to GitHub first if
   you haven't). Railway picks up `railway.json` automatically:
   - build: `npm ci && npm run build:api`
   - start: `node dist/api/main.js`
   - healthcheck: `/api/site`
2. In the same project: **+ New** → **Database → PostgreSQL**.
3. On the API service → **Variables**, set (template: `apps/api/.env.production.example`):
   - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}` (reference the plugin — Railway autocompletes)
   - `ADMIN_USERNAME` / `ADMIN_PASSWORD` — **change from the seed default** (`admin@interisland.com` / `1111`)
   - `ADMIN_COOKIE_SECURE=true`, `CUSTOMER_COOKIE_SECURE=true` (HTTPS-only cookies)
   - `BOOKINGS_OPEN` — **launch gate**: bookings are CLOSED by default (every date/slot blocked;
     the booking page shows "Online booking opens soon" with a WhatsApp CTA). Set to `true` on
     launch day to open online booking.
   - Don't set `PORT` (Railway injects it) or `HOST` (defaults to `0.0.0.0`).
4. API service → **Settings → Networking → Generate Domain**. Copy it, e.g.
   `ae-api-production.up.railway.app`.
5. Smoke test: open `https://<railway-domain>/api/site` — JSON content should render.
   Tables are auto-created on first query (no manual migrations).

## 2. Vercel — Web

1. Edit **`vercel.json`**: replace `YOUR-RAILWAY-DOMAIN.up.railway.app` with the domain from
   step 1.4. Commit + push.
2. vercel.com → **Add New → Project** → import the same GitHub repo. `vercel.json` already sets
   build (`npm run build:web`) and output (`dist`) — no framework settings needed. Deploy.
3. Smoke test on the Vercel URL:
   - Home/pricing render (content comes from `GET /api/site` through the rewrite).
   - Sign up + sign in works (cookie survives — it's first-party via the rewrite).
   - Booking page: **"Online booking opens soon"** notice appears after entering an address
     (because `BOOKINGS_OPEN=false`).
   - Admin sign-in at `#signin` with your new `ADMIN_USERNAME`.

## 3. Before real customers — fill real values

- `src/lib/company.ts`: `paynowUen`, `bankAccount`, `uen` (waiting on Elvin), and `siteUrl`
  (the production domain — invoice public links use it).
- Custom domain: add it in Vercel → Domains (e.g. `ae-mgmt.com`), point DNS per Vercel's
  instructions. The `/api` rewrite works unchanged on the custom domain.
- Remove `"84"` from `ALLOWED_PHONE_REGIONS` in `src/lib/phone.ts` +
  `apps/api/src/customer/phone.ts` (VN test allowance).
- Launch day: set `BOOKINGS_OPEN=true` on Railway (service restarts automatically).

## 4. Post-deploy smoke test (full flow, after opening bookings)

1. `GET /api/site` returns content.
2. Sign up a customer → book → it appears in their account.
3. Admin sign in → confirm → mark completed → invoice generated.
4. Open the invoice public link in a private window → renders with no login; QR + PayNow UEN +
   reference show real values.
5. Admin "Send invoice via WhatsApp" opens wa.me with the Luce-format message.
6. Booking a taken slot is blocked (`SLOT_CAPACITY`, default 1).

## 5. Notes / backlog for scale

- **WhatsApp auto-send** (currently manual): upgrade to WhatsApp Business Cloud API — Meta business
  verification (Pte Ltd docs) + a dedicated number + an approved "utility" template; ~US$0.02–0.04
  per message, user-initiated 24h replies free, no monthly platform fee if you call Meta directly.
- **Backups:** enable automated Postgres backups on Railway.
- **Secrets:** never commit `.env`; set env vars in the host dashboards.
- Cross-origin fallback: if you ever call the API directly from another origin (no rewrite), set
  `CORS_ORIGINS=https://your-web-domain.com` on the API service.

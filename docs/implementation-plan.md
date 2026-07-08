# AE Blue Cleaning Platform — Implementation Plan

## Current Product Goal

Build a premium Singapore residential cleaning platform that clearly supports:

- Residential cleaning subscription: weekly, fortnightly, one-time hourly cleaning.
- Move-in / move-out cleaning: handover, pre-move-in, tenancy reset.
- Post-renovation cleaning: fine-dust reset and photo/checklist proof.
- A simple online booking system: request, AE confirms cleaner availability, service is completed, then the invoice with PayNow / PayLah QR appears.

## Current Lifecycle Truth

The active business lifecycle is:

`request -> AE confirms visit -> service completed -> invoice with QR -> paid`

Admin confirmation only confirms the slot. It must not create or show a payment request. The invoice
and PayNow / PayLah QR are generated only after the service is completed. Any older phase note that
treats admin confirmation as a payment trigger is historical and must not guide new implementation.

## Design Direction

- Primary UI color is soft blue: `#2563EB`, hover `#1D4ED8`, navy accent `#0F3B7A`.
- Light neutral surfaces, white cards, blue-tinted borders, Figtree/Astryx typography.
- Green is only for WhatsApp or eco-specific affordances.
- Gold is only for stars and pending/payment status.
- Use shadcn/Radix primitives already in `src/components/ui`; do not add another UI library.

## Page Requirements

- Home: conversion-led hero and concise proof that AE provides reliable residential cleaning.
- About: editorial company story with operational credibility and HSS-ready positioning.
- Services: showcase page with three distinct service layouts and unique realistic images.
- Pricing: Claude-inspired plan cards plus searchable feature comparison matrix.
- How It Works: explain `request -> AE confirms -> clean completed -> invoice ready -> paid`.
- Reviews: blue-led social proof with avatars, gold stars, service tags, locations, dates.
- Contact: clear support form and WhatsApp path.
- Booking: Luce-inspired split flow with service selection, availability lookup, slot selection, details, review, account-gated submit, pending lock, and QR-ready status.
- Admin: admin can log in, inspect full customer requests, and approve bookings.

## Booking / Account Contract

- Logged-out users can browse the booking wizard, but protected actions open the account modal.
- Customers sign up or log in with email/password.
- New bookings require customer session and are saved with `customer_user_id`.
- Customer account modal shows pending, confirmed, completed, invoice-ready, and paid bookings after refresh.
- Admin seed credentials: `admin@interisland.com / 1111`.
- Multiple bookings per account are allowed; duplicate submit of the same request is blocked by the UI after creation.

## API Contract

- `POST /api/availability/search`
  - Request: `{ postalCode, address, serviceId, frequency, duration, sizeTier }`
  - Response: `{ serviceable, message, searchId, weekStart, dates: [{ date, label, surcharge, available, slots: [{ time, rate, total, available }] }] }`
- `POST /api/bookings` requires `ae_customer_session`.
- `GET /api/customer/bookings` returns full customer booking detail for account history.
- `GET /api/admin/bookings` returns full request detail and customer account information.

## QA Gate

- `npm run typecheck:web`
- `npm run build`
- API smoke: anonymous create 401, customer signup/login, availability search, booking create, customer list after refresh, admin login, admin confirm, admin complete, customer invoice-ready update.
- Browser QA at `320 / 390 / 768 / 1024 / 1440` for `#home`, `#services`, `#pricing`, `#reviews`, `#booking`, `#admin`.
- No horizontal scroll, clipped text, broken CSS, duplicate images, duplicate layouts, sticky overlap, wrong star color, green primary drift, or unusable mobile modal.

## Phase 12 — Luce-parity pass: 3D icons, 3-panel mega-menu, booking-option modal, sign-in page, screenshot bug fixes

Client: "luce looks beautiful — study it carefully and match it," plus specific UI bugs from
screenshots. The palette is now the **soft-blue system** in `references/design-system.md`
(blue-600 #2563EB primary — code already migrated; keep gold = pending-only discipline).
**Assets ready:** 14 Microsoft Fluent 3D emoji PNGs (MIT) at `src/assets/icons3d/` —
house, broom, sparkles, key, calendar, clipboard, soap, star, phone, money, package, chat,
bucket, bell. Use these to get luce's colorful-3D-icon feel. Do NOT hotlink anything.

### 12.1 Icon3D component + adoption
- `src/components/Icon3D.tsx`: `<Icon3D name size>` renders the PNG (`w/h` set, `alt=""`,
  `draggable=false`) inside an optional soft tile (`bg-sky-100 rounded-2xl p-2`).
- Replace the repetitive lucide sparkles on: mega-menu items, booking step-1 option cards,
  Services page section markers, How-It-Works step nodes (keep lucide for small inline/utility
  icons like chevrons, checks, form icons). **Every option card gets a DIFFERENT icon:**
  Weekly=broom, Fortnightly=calendar, One-time=bucket, Move-In/Out=key, Post-Renovation=sparkles,
  subscription/menu Home item=house, checklist=clipboard, pricing=money, eco/soap where relevant.

### 12.2 Mega-menu v3 — true luce 3-panel structure
Rebuild `ServicesMegaMenu` as a wide (~980px) white rounded-3xl panel, 3 columns like luce:
1. **Left category rail** (bg-paper inner column): two selectable category cards with Icon3D —
   `Cleaning Services` (house) and `Plans & Support` (money). Selected card = white bg + blue
   border. Switching swaps the middle list.
2. **Middle list**: items with 44px Icon3D + title (15px semibold) + one-line desc (13px ink/60)
   + chevron; hover = `bg-sky-100/60`. Cleaning Services → Residential Subscription (broom),
   Move-In/Out (key), Post-Renovation (sparkles). Plans & Support → Pricing (money), Cleaning
   Checklist (clipboard), How It Works (bell), Track my booking (phone → opens sign-in page).
3. **Right detail flyout** (bg-sky-100/50 rounded-2xl): shows the HOVERED middle item's detail —
   title, 2-line desc, sub-links with prices (e.g. Subscription → `Weekly from S$25/hr`,
   `Fortnightly from S$27/hr`, `One-time from S$30/hr`; Move-In/Out → size-tier from-prices) and a
   `Book this` pill that deep-links `#booking` with the option preselected (persist choice via
   `sessionStorage.aePreselect = serviceId/frequency`, read once by the wizard on mount).
   Default flyout = Residential Subscription.
- Keyboard: arrow/tab navigable, Esc closes; mobile Sheet keeps the simpler grouped list (with
  Icon3D swapped in).

### 12.3 "Select booking option" modal (luce pattern, user screenshot)
- Clicking **Book Now** (header + hero + CTA bands) opens a small centered Dialog: Icon3D `chat`
  or `phone` illustration, title `Select booking option`, sub `Book instantly online, or chat
  with AE on WhatsApp.`, two full-width buttons: primary `Book instantly online` → `#booking`;
  outline with WhatsApp logo `Chat with AE` → wa.me link. (Direct `#booking` anchor links inside
  the booking page itself must NOT open the modal recursively.)

### 12.4 Sign-in page (luce layout, wired to the REAL customer accounts)
Customer email/password auth already exists (`apps/api/src/customer/*`, `CustomerAccountDialog`,
`ae_customer_session`, account-gated booking submit) — do NOT invent a parallel track-by-ID
system. Present that existing auth luce-style:
- New route `#signin` (header `Sign in` button navigates there; the account Dialog stays for
  in-wizard gating). Two-column like luce's sign-in page: left white card = the existing
  login/signup form (email + password, `Sign in` primary, divider `Don't have an account` +
  outline `Sign up` toggle — reuse the CustomerAccountDialog form logic/component). Right promo
  card (bg-sky-100): Icon3D phone, `Get updates on WhatsApp`, real scannable QR (reuse `qrcode`
  lib) encoding `company.whatsappHref`, small outline `Chat with AE`.
- After sign-in, the page shows the customer's bookings (reuse the account bookings list +
  `BookingStatusTimeline`/QR states) instead of the form. Signed-in header shows the account
  entry point instead of `Sign in`.

### 12.5 Screenshot bug fixes (booking page)
- **One-time orphan layout**: in step 1, lay the hourly group as ONE `lg:grid-cols-3` row
  (Weekly / Fortnightly / One-time) under heading `Hourly cleaning`, and Packages as its own
  2-col row — no half-empty rows at desktop width.
- **Chat Sales contrast bug** (white text on light green): restyle as luce does — white bg,
  `border-line`, WhatsApp green logo + `text-ink` label `Chat with AE on WhatsApp`. The WhatsApp
  brand green may appear only as the icon, never as a text-bearing light fill.
- Stepper: keep; ensure completed node = solid blue check, active = sky pill, labels never clip.
- Summary rail: `Est. total` typography per design-system (blue price), spacing tidy at 320–1440.

### 12.6 QA gate
- typecheck + build; screenshots: mega-menu open (both categories + flyout), booking-option modal,
  `#signin` (idle + tracked states), booking step-1 at 390/1440; icon uniqueness audit (no two
  adjacent cards share an icon); yellow-only-pending grep still passes; WhatsApp-green-as-fill
  grep: no `bg-[#25D366]`-style fills with text; booking flow re-verified end-to-end (submit →
  pending → admin confirm → QR); 45-combo h-scroll audit still clean.

## Phase 13 — Pay-after-service invoice (current approved flow)

Current approved flow supersedes older payment-on-confirmation notes: **request → AE confirms cleaner
availability → service completed → invoice with PayNow / PayLah QR appears → paid**. Keep the
auto-generated invoice/QR surface, but show it only after admin marks the service completed.

### 13.1 Lifecycle change (DB + API)
- Booking statuses: `received → confirmed → completed → paid/cancelled?`; invoice rows are used for
  QR details after completion. Payment becomes `payment_status: none → invoice_unpaid → paid`.
  **Admin confirm schedules the visit only**. Admin complete generates the invoice and QR.
- New `invoices` table: `id, booking_id, invoice_no (AE-YYYY-NNNN sequential), amount_cents,
  currency 'SGD', line_items_json (service, hours×rate, weekend surcharge, add-ons), status
  'unpaid'|'paid', created_at, paid_at`.
- New admin endpoints (same session guard):
  - `PATCH /api/admin/bookings/:id/confirm` → confirms the visit, no invoice or QR.
  - `PATCH /api/admin/bookings/:id/complete` → completes the service and prepares the payment QR
    using the stored estimate or final amount.
  - `PATCH /api/admin/invoices/:id/paid` → `paid` + `paid_at` (booking payment_status `paid`).
- `GET /api/bookings/:id`, `GET /api/customer/bookings`, `GET /api/admin/bookings` all include
  the invoice summary (`invoiceNo, amount, status, createdAt`) when one exists.
- Keep `paymentQrPayload` but attach it to the INVOICE stage: QR + PayNow details render only
  when an unpaid invoice exists.

### 13.2 Customer-facing invoice (auto-generated from the website)
- `InvoiceView` component (used in the account/`#signin` bookings list and the booking result
  page): a clean printable invoice — AE letterhead (logo, `AE Management Services Pte Ltd`,
  `UEN [CLIENT TO CONFIRM]`), invoice no + date, booking ref, line items table, total `S$X`,
  then **payment instructions exactly like luce's message**: `PayNow (preferred)` — Account
  Name, `PayNow UEN [CLIENT TO CONFIRM]`, `Reference: <invoice_no>` — plus the scannable PayNow
  QR (existing `qrcode` lib), and `Bank transfer` details line. NO credit-card option.
  A `Download / Print invoice` button triggers `window.print()` with a print stylesheet that
  isolates the invoice (this is the "auto-generated PDF" — browser save-as-PDF).
- Status timeline: Submitted → AE checking → Visit confirmed → Service completed → Invoice ready
  → Paid. The booking result page, account list, and sign-in area all reuse it.

### 13.3 Admin ops
- Admin bookings table: per row show status chip + invoice chip; primary actions are `Confirm`
  (visit only) → `Mark completed` (creates invoice/QR) → `Mark paid` (when invoice unpaid).
- **"Send invoice via WhatsApp"** button per completed booking: `wa.me/<customer phone>` deep
  link prefilled with the luce-style message (greeting w/ customer name, invoice amount, invoice
  no as reference, PayNow account name + UEN, link hint "view your invoice by signing in at
  <site>"). This is the manual notification path (no WhatsApp Business API — no extra fees).
- Admin tiles update: Total / Pending / Invoice ready / Paid.

### 13.4 QA gate
- typecheck + build; full lifecycle via API AND UI: signup+book → admin confirm (NO QR shown,
  confirmed message instead) → admin complete (invoice auto-created, number sequential) →
  customer sees invoice + PayNow QR + reference in account and can print it → admin mark paid →
  customer timeline shows Paid. Restart API → data survives. Old bookings with legacy `qr_ready`
  must not crash the timeline (map legacy → invoice_unpaid presentation or handle gracefully).
- Screenshots: confirmed state (no payment), invoice view (screen + print preview), admin row
  actions, paid state, at 390 + 1440. Grep gates (gold pending-only, no card/gateway text) pass.

## Phase 14 — Wizard UI repair + WhatsApp-number identity + auto-invoice on service end

Client feedback: (a) booking step-1 UI is broken ("break UI tùm lum" — title/price text overlapping
in the option cards), (b) like luce, the PHONE NUMBER is the WhatsApp identity — capture it
properly, (c) the invoice should be generated & delivered automatically when the service ends,
not wait for a manual admin action. Runs AFTER Phase 13.

### 14.1 Booking wizard UI repair (regression from recent redesigns)
- Rebuild the step-1 option card internals with a SAFE layout: `flex flex-col gap-3` only —
  icon row (Icon3D + badge), title (h3), price line (`from S$X/hr`), desc, sub-note, radio in the
  top-right via `absolute top-4 right-4` on a `relative` card (nothing else absolute). NO negative
  margins, NO fixed heights, `min-w-0` everywhere. Price font scales down at narrow widths
  (`text-2xl md:text-[2rem]`).
- Card grids: hourly `grid-cols-1 md:grid-cols-2 xl:grid-cols-3`, packages `grid-cols-1
  md:grid-cols-2` — never 3 columns below 1280 if cards would be < 280px wide.
- **Overlap QA is mandatory**: run a DOM overlap check (any two text nodes intersecting) on the
  booking page at 640/700/768/834/1024/1280/1440 — zero intersections allowed. Also re-check the
  whole wizard (progress rail, account rail, summary) at those widths: no clipped text, no
  h-scroll, tap targets ≥40px.

### 14.2 WhatsApp number = identity (luce pattern)
- Luce signs users in by phone (+65) — that number IS the WhatsApp destination. Adapt:
  - Signup form + wizard Contact step: field label `Mobile (WhatsApp) — +65` with a fixed +65
    prefix box, 8-digit SG validation (starts with 8 or 9); one shared component + validator in
    `src/lib/phone.ts` (`normalizeSgPhone` → `+65XXXXXXXX`, `isValidSgMobile`).
  - Store normalized on customer_users.phone AND bookings.customer_phone; wizard prefills from
    the signed-in account and pushes back updates on booking submit.
  - Admin table + invoice WhatsApp links all use the normalized number (`wa.me/65XXXXXXXX`).
  - Existing rows: normalize on read, never crash on legacy formats.

### 14.3 Auto-complete scheduler
- Scheduler support is non-primary. Do not let it change the customer-facing requirement that the
  invoice and QR appear only after service completion.

### 14.4 QA gate
- typecheck + build; overlap sweep (14.1) zero hits at all 7 widths; SG phone validation unit
  cases (8/9-prefix pass, 6/7 fail, spaces/dashes normalized); scheduler test: insert a confirmed
  booking with a past date directly via SQL → wait one scheduler tick (or expose a dev-only
  trigger) → booking auto-completes + invoice exists + customer endpoint shows it; full lifecycle
  re-verified via UI; screenshots booking step-1 at 700 + 1024 + 1440 and invoice view.

> Phase 14 amendment: phone validation must also accept +84 (VN) for testing; prefix selector +65|+84; ALLOWED_PHONE_REGIONS constant for easy removal.

> ### CLIENT DECISION (2026-07-08, Elvin): manual invoice sending for now
> "We don't do this first. Prob just manually send invoice to client for now. Since no business
> yet — maybe when we grow bigger." → **WhatsApp Business Cloud API is DEFERRED to backlog.**
> The operating flow is:
> 1. Customer books → admin confirms (chats on WhatsApp manually as usual).
> 2. Admin opens `#admin`, checks cleaner availability, and clicks **Confirm**.
> 3. The website auto-generates the invoice reference `AE-YYYY-NNNN` only after the service is
>    completed; the customer sees the invoice and QR in their account then.
> 4. Admin may use **Send invoice via WhatsApp** as a manual notification shortcut.
> 5. Customer pays PayNow / PayLah → admin **Mark paid**.
>
> **Phase 14 amendment superseded:** keep any scheduler/due-completion fields inert unless explicitly
> activated by operations. The active requirement is pay-after-service invoice, not payment on confirmation.
> Backlog note for the future
> upgrade: WhatsApp Business Cloud API direct from
> Meta — utility template ≈ US$0.02–0.04/message (≈ S$0.03–0.06), user-initiated 24h-window
> replies free, no monthly platform fee if direct (BSPs like Twilio/Wati add markup); one-time
> setup = Meta business verification (needs Pte Ltd docs, days–weeks) + a dedicated phone number
> + template approval + ~1 day integration where the invoice is generated.

## Phase 15 — Unified login (admin + customer share one sign-in), remove the separate admin login form

Client: there is no admin login screen — admin should use the SAME login as customers. Today
`#signin` only authenticates against `customer_users` (typing `admin@interisland.com` there returns
"Invalid customer credentials"), while `#admin` has its own username/password form hitting
`/api/admin/login`. Unify into ONE sign-in. Do NOT touch the booking/invoice flow.

### 15.1 Unified auth endpoint
- Add `POST /api/auth/login {email, password}` in a small auth controller that:
  1. Tries admin first via the existing `loginAdmin` helper (admin seed username IS an email:
     `admin@interisland.com`). On success set the admin session cookie and return
     `{ role: "admin", name }`.
  2. Else tries `loginCustomer`. On success set the customer session cookie, return
     `{ role: "customer", name }`.
  3. Else `401 { message: "Invalid email or password." }`.
  - Precedence = admin table first (internal emails are distinct from customer emails); document
    this. Keep the existing `/api/admin/login` and `/api/customer/login` untouched for
    compatibility (the unified endpoint reuses the same helpers/cookies).
- Add `GET /api/auth/me` → `{ role: "admin"|"customer"|null, name }` by checking both sessions
  (admin session wins if both somehow exist). Frontend uses it on load to decide what to render.

### 15.2 `#signin` becomes the single login for everyone
- The Sign in tab posts to `/api/auth/login`. On success:
  - `role === "admin"` → navigate to `#admin` (now renders the panel directly for the authed admin
    session — see 15.3).
  - `role === "customer"` → render the customer bookings/account view inline as it does now.
- The **Sign up** tab stays customer-only (admins are seeded, never self-serve). Copy tweak:
  subtitle "Customers and AE staff sign in here." Keep the right promo/WhatsApp card.
- Error copy: one message "Invalid email or password." (never reveal which table matched).

### 15.3 `#admin` no longer has its own login form
- Remove the username/password form from `AdminPage`. On mount, call `/api/auth/me` (or the
  existing admin `me`): if not an admin session → show a short "Please sign in as AE staff" with a
  button to `#signin` (do NOT render a second login form). If admin → render the existing admin
  bookings/invoices panel unchanged.
- Header: logged-out → `Sign in`; admin session → an `Admin` link (to `#admin`) + sign out;
  customer session → the account entry as today. Use `/api/auth/me` for this state.

### 15.4 QA gate
- typecheck + build; via API: `POST /api/auth/login` with `admin@interisland.com/1111` → `role:admin`
  + admin session works on `GET /api/admin/bookings`; with a customer email/pw → `role:customer` +
  `GET /api/customer/bookings` works; wrong pw → 401; `GET /api/auth/me` reflects each.
- Via UI: signing in at `#signin` as admin lands on the admin panel; as customer shows bookings;
  `#admin` while logged-out shows the sign-in prompt (no form); logout returns to logged-out state.
- Screenshots: `#signin` (one form), `#admin` logged-out prompt, admin panel after unified login,
  at 390 + 1440. Booking/invoice lifecycle still passes end-to-end.

## Phase 16 — Pricing page responsive fixes (comparison table clipping + card-section bleed)

Client screenshots show text bleeding/cut off on the pricing page. Confirmed causes (measured):
- The **"Compare plans by operating quality" feature comparison table** is wider than the
  viewport at ≤~1100px and its right columns get **clipped** (the "Package" column header and
  cells are cut off; hscroll=0 so it silently clips instead of scrolling). Row label
  "Reliability and recovery" measured `right=945` past a 900px viewport.
- The two-column card sections (hourly + packages) can show the left intro's tail characters
  ("…available" → "ble", "…home cleaning," → "g cleaning,") bleeding at the left edge at some
  widths — the left intro column must never be clipped/overlapped by the cards grid.

Do NOT change pricing content/numbers or other pages.

### 16.1 Comparison table — never clip, responsive
- Wrap the table in an `overflow-x-auto` scroll container with a sensible `min-w-[720px]` so on
  narrow screens it scrolls horizontally inside its own box (with a subtle right-edge fade hint)
  instead of clipping — the page body must still have NO horizontal scroll.
- Better for mobile (≤768px): collapse the matrix into **per-plan stacked cards** (one card per
  plan: Weekly/Fortnightly/One-time/Package, each listing its feature→value rows), OR keep the
  scroll container — pick the cleaner result and ensure every value is readable, nothing cut.
- The search/filter input and section header stay full-width and above the table.

### 16.2 Card sections — left intro never bleeds
- Audit the hourly + packages two-column layouts: the left intro column (`Pick cadence before
  duration` / packages intro) must be fully visible with `min-w-0` and proper grid columns
  (`lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]` or stack < the chosen breakpoint). The cards
  grid must not overlap or push the intro off-screen. No element may have `left < 0`.

### 16.3 Full pricing responsive sweep
- At 320/360/390/414/640/768/834/960/1024/1200/1280/1440: run a DOM audit that FAILS on any
  element with `getBoundingClientRect().left < -1` (left bleed) OR `right > clientWidth+1` while
  outside a designated `overflow-x-auto` scroller (right clip) OR page-level horizontal scroll.
  Fix every hit. Screenshots at 390 / 768 / 1024 / 1280.

### 16.4 QA gate
- typecheck + build; the 16.3 audit passes at all listed widths (only the comparison table's own
  scroll container may exceed viewport internally); screenshots show the comparison table fully
  readable (scroll or stacked) and no card-section left bleed; no page horizontal scroll anywhere.

## Phase 17 — Luce-identical invoice: WhatsApp message format + shareable invoice link + real company details

Client wants the invoice WhatsApp message to be IDENTICAL in format to Luce's, with a clickable
link to view the invoice (like Luce's tokenized URL), and real AE contact details. WhatsApp
sending stays MANUAL (admin taps the prefilled wa.me link) — only the message body + link change.

### 17.1 Real company details (`src/lib/company.ts`)
- `phone: "+65 6980 3559"` (AE office, from client) — remove [CLIENT TO CONFIRM].
- `email: "hello@ae-mgmt.com"` (client chose hello@ over sales@).
- `whatsappNumber: "6569803559"`, rebuild `whatsappHref` accordingly.
- Add: `paynowUen: "" /* [CLIENT TO CONFIRM] */`, `bankName: "DBS"`,
  `bankAccount: "" /* [CLIENT TO CONFIRM] */`, `billingWhatsapp: "+65 6980 3559"`,
  `siteUrl: "" /* [CLIENT TO CONFIRM production domain; falls back to window.location.origin */`.
- Keep `uen` (business UEN) as [CLIENT TO CONFIRM].

### 17.2 Shareable, token-gated invoice link (no login needed — like Luce)
- `invoices` table: add `public_token text` (random 24+ char, generated when the invoice is
  created). Migrate existing rows with a backfill token.
- Public API `GET /api/invoices/:invoiceNo?token=...` → returns the invoice detail (booking ref,
  line items, amount, status, PayNow/bank fields) ONLY when the token matches; else 404. No auth.
- Public frontend route: `#invoice` reading the invoice no + token from the URL (scheme:
  `<siteUrl or origin>/?invoice=AE-2026-0003&token=XXXX#invoice`). It renders the existing
  `InvoiceView` read-only (letterhead, line items, PayNow UEN + Reference + QR, Print/PDF) WITHOUT
  requiring sign-in. Invalid/missing token → a friendly "invoice link expired or invalid" card.
- Add a `buildInvoicePublicUrl(invoice)` helper used by both the admin message and the account view.

### 17.3 WhatsApp invoice message = Luce format (WhatsApp markdown, no credit card)
Replace `buildInvoiceWhatsappHref` in AdminPage with a shared `buildInvoiceMessage(booking, invoice)`
that produces EXACTLY this (WhatsApp `*bold*`, real newlines, no Credit Card since AE has no gateway):

```
*Invoice for your most recent service*

Hi {customerFirstName}!

Thank you again for choosing AE Management Services. The invoice for your recent visit is now ready.

Invoice Amount: S${amount}

You may view your invoice by clicking this link: {publicInvoiceUrl}. We accept payment by PayNow (preferred) or Bank Transfer.

*PayNow:*
• *Account Name ({bankName})*: {legalName}
• *PayNow UEN*: {paynowUen or [CLIENT TO CONFIRM]}
• *Reference*: Please indicate *{invoiceNo}* as your reference number.

*Online Bank Transfer:*
• *Account Name ({bankName})*: {legalName}
• *Account Number*: {bankAccount or [CLIENT TO CONFIRM]}
• *Reference*: Please indicate *{invoiceNo}* as your reference number.

*IMPT: Please include the reference number for PayNow or Bank payments, otherwise we may not be able to recognise your payment.*

If you have any questions regarding your billing, please WhatsApp us at {billingWhatsapp}.

Regards,
AE Management Services
```
- `wa.me/<customer phone>?text=<encoded message>` — customer's normalized phone (65/84).
- The `InvoiceView` payment section must show the SAME fields (Account Name, PayNow UEN, Bank
  Account, Reference = invoice no) so screen + WhatsApp + printed PDF match Luce's structure.

### 17.4 End-to-end flow + UI parity check (report, don't just build)
- Walk the whole journey and confirm it mirrors Luce (differences allowed ONLY: no WhatsApp
  Business API auto-send, no credit-card option): browse → mega-menu → book (wizard) → account-
  gated submit → pending "AE confirming" → admin confirm → (service) → admin mark completed →
  invoice auto-generated → admin "Send invoice via WhatsApp" opens the Luce-format message with
  the working public link → customer opens link (no login) and sees the invoice + PayNow QR →
  admin mark paid → timeline Paid. Verify each step via API + UI and report a Luce-vs-AE parity
  table.

### 17.5 QA gate
- typecheck + build; API: create→confirm→complete→invoice has `public_token`; public GET with
  token returns invoice, with wrong token 404; the generated WhatsApp text matches the template
  verbatim (spot-check the exact string incl. `*bold*` and bullet chars); open the public invoice
  URL in a fresh browser context (no cookies) → invoice renders. Screenshots: public invoice page
  (desktop + mobile), admin row with Send button, the composed message (log the decoded text).

## Phase 18 — Tone down "all blue" (Elvin: "don't need all blue") + pricing card alignment holds

Blue #2563EB is currently used on almost everything (prices, half of every heading, eyebrows,
check icons, stats) so the site reads mono-blue. Reduce blue to a deliberate ACCENT while keeping
the brand. Do NOT change layout/content/flow. Reviewer already made pricing cards flex-col with
bottom-aligned `Book this rate` buttons + package prices `mt-auto` — keep that.

### 18.1 Blue-usage rules (make blue an accent, ~60% less)
Blue (`blue-600/700`) is allowed ONLY for: primary buttons/CTAs, small UPPERCASE eyebrows, text
links, active nav state, focus rings, and the featured-card border/badge. Change everything else:
- **Prices** (hourly `S$24-S$26/hr`, package `S$300-S$450`, plan prices) → `text-ink` (not blue).
- **Section-heading emphasis spans** → `text-ink` by DEFAULT (remove the blue on `duration.`,
  `higher-value jobs.`, `built for reliability.`, `operating quality.`, etc.). EXCEPTION: keep the
  **hero h1** emphasis blue (one signature blue moment) and the booking summary `Est. total`.
- **Feature check icons / list bullets** → `text-ink/45` (muted), not blue.
- **Stat numbers** (About/Reviews/Why) → `text-ink` (keep the label eyebrow blue).
- **Icon tiles**: keep `bg-sky-100` tile but the lucide icon → `text-ink` (not blue) except where
  it's an interactive/nav affordance.
- Keep gold = pending/status only; keep WhatsApp green icon-only; sky-100 soft chips stay.

### 18.2 Sweep + verify
- Grep after: `grep -rn "text-blue-6" src --include=*.tsx` should be small and only on
  eyebrows/links/CTAs/hero/est-total — not on prices, stats, or section emphasis spans.
- Screenshots home/pricing/services/booking/reviews at 390 + 1440: the page reads
  neutral/ink/white with blue as an accent, not dominant. No layout regressions; pricing card
  buttons stay bottom-aligned.

**QA gate:** typecheck + build; the blue-usage grep is clean; screenshots confirm reduced blue;
no functional/flow change.

## Phase 19 — Block off dates (prevent double-booking) + admin manual blocks

Elvin: "block off the dates first in case someone makes a booking." Add real availability so a
slot can't be double-booked, plus admin-defined blocked dates (holidays / no cleaners).

### 19.1 Data + availability logic
- New `blocked_dates` table: `id, date, reason, created_at` (admin-managed full-day blocks).
- A date+time slot is UNAVAILABLE if: it's in `blocked_dates`, OR the count of active bookings
  (`status in ('received','confirmed','completed')`) for that date+time reaches a capacity
  constant `SLOT_CAPACITY` (default 1; single-team assumption — configurable).
- Extend `POST /api/availability/search` (already exists) so each returned slot's `available`
  reflects blocked dates + existing booking counts. Past dates always unavailable.
- On `POST /api/bookings`: re-check availability server-side and reject with a clear 409
  `{message:"That slot was just taken — please pick another."}` if the chosen slot is no longer
  free (guards the race between search and submit).

### 19.2 Booking calendar UI
- In the wizard Date & time step, disable/grey out fully-booked and admin-blocked dates in the
  shadcn Calendar (via `disabled` matcher fed from availability), and hide/disable taken time
  slots for the selected date. Show a small "Fully booked" / "Unavailable" hint.
- If server returns 409 on submit, surface the message and send the user back to the Date step.

### 19.3 Admin blocked-date management
- Admin `#admin` gets a small "Blocked dates" panel: list + add (date + reason) + remove, via
  `GET/POST/DELETE /api/admin/blocked-dates` (admin-session guarded).

### 19.4 QA gate
- typecheck + build; API: book a slot → availability search shows it unavailable → second booking
  of the same slot 409; admin adds a blocked date → that date shows unavailable in search;
  removing it frees it; past dates unavailable. UI: booked/blocked dates greyed in the calendar,
  taken time slots disabled, 409 handled. Screenshots of calendar with disabled dates + admin
  blocked-dates panel. Booking lifecycle still passes.

## Phase 20 — Reconcile status flow to pay-after-service (identical to Luce) + fix account/invoice UI

Full-site audit (Claude, 2026-07-08) — findings to fix. Public pages are otherwise clean: fonts
all Figtree, no page h-scroll, no console errors, blue already toned down (Phase 18), home "overflow"
is an intentional reviews marquee (not a bug), no duplicate layouts.

### 20.1 THE main bug — status timeline/copy still uses the old confirm-payment model
Older UI copy treated admin confirmation as the payment trigger. This contradicts the
pay-after-service model (backend + "Invoice unpaid" badge) and confuses users because the invoice
should come after the service.
Reconcile EVERYTHING to pay-after-service (Elvin's decision, mirrors Luce):
- New 6-stage timeline mapped from `status` + `paymentStatus`:
  1. **Submitted** — done once the booking exists.
  2. **AE confirming** — current when `status==='received'`.
  3. **Visit confirmed** — done when `status` is `confirmed` or `completed`.
  4. **Service completed** — done when `status==='completed'`.
  5. **Invoice ready — pay by PayNow** — current when `paymentStatus==='invoice_unpaid'`; the
     PayNow QR + `InvoiceView` render HERE and only here (gold accent).
  6. **Paid** — done when `paymentStatus==='paid'`.
  - Map any legacy `paymentStatus` values (`qr_ready`/`instructions_pending`) onto this presentation
    as invoice-unpaid-style rows so old rows don't break.
- Replace all old confirm-payment wording (timeline + `CustomerAccountDialog` benefits +
  `SignInPage` "Why sign in?" + the BookingPage right-rail assurances) with pay-after-service
  wording, e.g. "AE confirms your visit first — the invoice and PayNow QR appear after the service
  is completed."
- No payment/QR is shown before `paymentStatus==='invoice_unpaid'`.

### 20.2 InvoiceView + account invoice never overflow (user screenshot: horizontal scrollbar, cut PayNow)
- `InvoiceView` must be fully responsive with NO horizontal scroll in ANY container (the
  `CustomerAccountDialog` modal, the `#signin` page column, and the public `#invoice` page):
  add `min-w-0`/`max-w-full` on the root and inner grids; the payment + QR block stacks vertically
  by default and only goes side-by-side when there's real room (`@container` or a wider breakpoint
  gated on the CARD width, not the viewport — the account column is narrow at desktop). No
  `whitespace-nowrap` and no fixed min-widths on invoice text.
- Verify: account (page + modal) and public invoice at 360/390/768/1024/1280 → the invoice card
  has zero horizontal scroll and no clipped PayNow/label text.

### 20.3 Small clips
- Booking card `Home` line (e.g. "Condominium · 2 bedrooms · 1 bathroom · Up to 700 sq ft") must
  wrap, not clip to "Up to 70 ft" on mobile.
- Status badge ("Invoice unpaid") must not truncate to "Invoice u.." on mobile — let it wrap or
  shrink the row, `shrink-0` + allow the title to wrap instead.

### 20.4 Full end-to-end + consistency verification (report)
- Re-run the whole journey and confirm ONE consistent story everywhere (badge + timeline + copy):
  book → AE confirming → Visit confirmed (NO payment shown) → Service completed → Invoice ready
  (InvoiceView + PayNow QR here) → Paid. Admin "Send invoice via WhatsApp" = Luce-format message.
- Confirm: fonts all Figtree; blue only on the allowed accents; no page h-scroll on any route at
  360/390/768/1024/1280/1440; no console/page errors; no duplicate layouts; API smoke has no 500s.

**QA gate:** typecheck + build; grep shows no old confirm-payment strings left in customer-facing
code; screenshots of the account (page + modal) + public invoice at 390 + 1280
with zero invoice overflow; the timeline shows the 6 pay-after-service stages; full lifecycle
re-verified.

## Phase 21 — Kick.com green accent (light surfaces) + booking card polish + invoice responsive fix

Client chose: adopt kick.com colors as a GREEN ACCENT on the current light/professional surfaces
(NOT full dark). Kick green = `#00e701`. Plus two concrete UI bugs to fix.

### 21.1 Kick green token swap (keep light surfaces + ink text)
Kick's `#00e701` is a neon green — great as a BUTTON FILL with near-black text (kick style), but it
FAILS contrast as text/links on white. So define two greens:
- `--color-primary: #00e701` (kick green) — button/CTA fills, featured-card border/badge, active
  states, the ONE hero emphasis. Button TEXT on this green = `#0b0e0f` (near-black), not white.
- `--color-primary-ink: #0A8A0A` (a readable darker green) — for green TEXT: eyebrows, links,
  section-emphasis spans, price-accent-if-any, check icons. Must pass AA on white.
- `--color-primary-soft: #E6FEE9` (light green tint) — soft chips/badges/icon-tiles bg (replaces
  sky-100), with `primary-ink` text.
- Repoint every `blue-600`→context: fills → `primary`(#00e701)+dark text; text/links/eyebrows/
  emphasis/checks → `primary-ink`(#0A8A0A); `blue-700`→`primary-ink`; `sky-100`→`primary-soft`.
  Keep ink/paper/cream/white surfaces, gold=pending-only, WhatsApp green icon stays.
- Grep gate after: no `blue-600`/`blue-700`/`sky-100`/#2563EB left in src. Contrast: green text
  on white ≥ AA (use primary-ink, never raw #00e701 for text). Buttons: #00e701 fill + #0b0e0f text.

### 21.2 Booking step-1 service cards — polish like Luce + fix price misalignment
The package cards (Move-In/Out, Post-Renovation) render the price ("from S$300") centered/mid-card,
misaligned with the left title/description (bug in the user screenshot). Rebuild the service radio
option cards to a clean Luce-style, CONSISTENT between hourly and package cards:
- Each card: Icon3D top-left + "Most popular"/"Popular" badge, title, price ("from S$X/hr" or
  "from S$X") in a consistent position/size (NO centering, left-aligned, one line where it fits),
  one desc line, a check sub-note, radio top-right on a `relative` card. Equal heights, `min-w-0`,
  `flex flex-col`. Hourly grid `md:grid-cols-3`, packages `md:grid-cols-2`. Selected = `primary`
  border + `primary-soft` tint. No overlap/misalignment at 360–1440.

### 21.3 Invoice payment section — bulletproof responsive (fix the broken container query)
`InvoiceView` uses `.invoice-payment-grid { container-type: inline-size }` AND queries the SAME
element with `@container` — a self-container that never applies (or crams PayNow + QR side by side
in narrow containers → horizontal scroll + cut text, per the user screenshot). Fix: make the
payment section ALWAYS single-column (PayNow details block, then the QR figure below it,
QR ≤180px). Remove the self-referential container query. The invoice must have ZERO horizontal
scroll and no clipped text in EVERY container: public `#invoice` page, `#signin` account column,
and the `CustomerAccountDialog` modal (w-[min(900px,100%-32px)]) at 320/360/390/768/1280.

### 21.4 QA gate
- typecheck + build; kick-green grep gate clean (no blue tokens, green text uses primary-ink);
  screenshots: home/pricing/booking/reviews at 390+1280 in the green accent, booking step-1 cards
  aligned (hourly + packages), and the invoice with NO overflow in page + modal + mobile.
  Full pay-after-service lifecycle still consistent. No console errors, no page h-scroll anywhere.

## Phase 22 — Color balance: tone the neon green down + no large green fills (client: "chói quá, không hợp")

Kick's `#00e701` is fluorescent and looks garish on a light professional site, especially as large
FILLS (the featured pricing card is a full neon-green block). Rebalance to a clean, professional
green (kick-adjacent but toned) used with RESTRAINT, and audit EVERY screen.

### 22.1 Retune the green tokens (calmer, professional, AA)
- `--color-primary: #16A34A` (a clean fresh green — professional, not fluorescent); button fills
  use WHITE text now (not near-black).
- `--color-primary-ink: #15803D` (deeper green for TEXT/links/eyebrows/emphasis/checks; AA on white).
- `--color-primary-soft: #E7F7EC` (soft green tint for chips/tiles/selected — subtle, not glaring).
- Update any `#0b0e0f` button-text back to white where the fill is now `#16A34A`.
- Keep ink/paper/cream/white surfaces, gold=pending-only, WhatsApp green icon.

### 22.2 No large neon/green FILLS — green is an accent
- **Featured pricing card**: NOT a full green block. Make it a white (or `cream`) card with a
  `border-primary` (2px) + a green "Most popular" badge + green price + a subtle `primary-soft`
  header strip at most. It should read as "highlighted", not "painted green".
- Audit every large `bg-primary` fill (hero emphasis box, CTA band, selected booking/service
  cards, any section band, admin tiles). Large surfaces use white/cream/`primary-soft` at most;
  full-saturation `primary` only on small elements (buttons, ≤8px dots, thin borders, tiny badges,
  timeline done-nodes ≤28px). No block larger than a button should be full `primary`.
- CTA band: keep the existing dark (navy-900/ink) OR a deep restrained green — never neon.

### 22.3 Check EVERY screen (client: "mọi màu phải reflect chuẩn")
- Walk home, about, services, pricing, how-it-works, reviews, contact, booking (all steps),
  signin, account (page + modal), admin, public invoice at 390 + 1280. Confirm: green appears as a
  tasteful accent (buttons/links/badges/borders), no glaring large green areas, text-green is the
  readable `primary-ink` (AA), selected states are subtle `primary-soft`, and the overall look is
  clean/professional/friendly. Fix any screen that still reads harsh.

### 22.4 QA gate
- typecheck + build; grep: no fluorescent `#00e701` used as a large `bg-` fill (only small
  accents if any); green text uses `primary-ink`; screenshots of all the above screens at 390+1280
  showing balanced color; no console errors; no page h-scroll; pay-after-service flow intact.

---

## Phase 23 — Invoice WhatsApp message: guarantee Luce-identical spacing (Copy path) + admin QR-copy cleanup

**Why.** The invoice message body that `buildInvoiceMessage()` produces is already byte-identical
to the Luce template (bold headers, blank-line spacing, PayNow + Online Bank Transfer + IMPT +
billing WhatsApp + Regards). The real defect is *delivery*: WhatsApp Web/Desktop strips the
newlines out of a `wa.me?text=` prefilled draft, so the customer receives one cramped paragraph
instead of the spaced layout. Luce avoids this only because it sends server-side via the WhatsApp
Business Cloud API — which is AE backlog, not now. Fix by giving the admin a reliable
**copy-then-paste** path: pasted text preserves every newline on every WhatsApp client.

**Do NOT change** the message wording, line order, or the `wa.me` link. Do NOT touch the backend,
pricing, invoice lifecycle, or any other page. Message content is correct — this phase is about the
admin surfacing it losslessly, plus one stale-copy cleanup.

### 23.1 `src/lib/invoice.ts` — leave `buildInvoiceMessage` content as-is
- Keep the exact multiline string (already Luce-format with real `\n` between every section).
- The greeting stays the customer's name as currently derived. No wording changes.
- Keep `buildInvoicePublicUrl` and `buildInvoiceWhatsappHref` unchanged.

### 23.2 `src/components/pages/AdminPage.tsx` — invoice-unpaid action block (~L571-584)
In the `invoiceUnpaid` branch, alongside the existing "Mark paid" and "Send invoice via WhatsApp"
buttons, add a lossless copy path:
- **"Copy message" button** (variant `secondary`, lucide `Copy` icon → `Check` icon while copied):
  copies the raw `buildInvoiceMessage(booking, booking.invoice)` string (real `\n` newlines) to the
  clipboard via `navigator.clipboard.writeText`. On success show a transient `Copied ✓` state for
  ~2s (via `useState` + `setTimeout`). Provide a graceful fallback for non-secure contexts:
  a hidden `<textarea>` + `document.execCommand("copy")`.
- **Helper caption** under the buttons (text-xs, muted):
  "WhatsApp Web strips line breaks from prefilled links — tap **Copy message**, open the chat, and
  paste so the spacing stays exact."
- **Collapsible preview** (`<details>` styled with the existing tokens, summary "Preview message"):
  renders the exact message inside a bordered `bg-paper` box with `whitespace-pre-wrap`,
  `break-words`, `min-w-0`, and a small readable font, so the admin verifies the markdown/spacing
  before sending. Must NOT cause horizontal scroll at 360–1280.
- Reuse existing design tokens (`primary`, `line`, `paper`, `muted-foreground`) and lucide icons.
  No new npm deps.

### 23.3 Stale-copy cleanup in the same file
- The right-rail InfoRow "Payment stage" (~L558) still reads `"QR being prepared"` / `"No QR yet"`,
  which contradicts pay-after-service. Change to pay-after-service wording:
  `booking.invoice ? "<invoiceNo> <status>" : confirmed ? "Visit confirmed — invoice after service" : "Awaiting AE confirmation"`.
- Grep the file for any other "QR" wording and align it to the pay-after-service story.

### 23.4 QA gate
- `npm run typecheck:web` + `npm run build` pass.
- Reviewer (screenshots): the admin invoice-unpaid card shows Mark paid + Copy message + Send via
  WhatsApp; clicking Copy flips to `Copied ✓`; the preview box renders the message with correct
  blank-line spacing and `*bold*` markers; no horizontal scroll on the admin card at 390 & 1280.
- Reviewer confirms the copied clipboard string contains real newlines (byte-for-byte Luce layout).
- Grep: no remaining "QR being prepared" / "No QR yet" strings in AdminPage.

---

## Phase 24 — Booking flow de-confusion (Luce placement) + phone +84 fix + admin date picker + one-active-booking + invoice-via-chat-only

User feedback: the booking page reads "tùm lum" (cluttered/confusing). Fix placement so the flow
is Luce-identical: configuration first, account only at the contact step, one clear rail. Plus 4
functional bugs. Do NOT touch ServicesPage (Phase 25), invoice.service.ts, buildInvoiceMessage,
pricing, or the admin Copy-message block from Phase 23.

### 24.1 Booking page: move sign-in INTO the wizard (kill the floating card)
`src/components/BookingPage.tsx`:
- DELETE the standalone "Customer account / Sign in when you are ready to submit." section that
  renders ABOVE `WizardProgress` (~L520-534). It reads as a competing first step and confuses users.
- Step 4 "Your details" (`currentStep === 3`): when `!customer`, render the existing
  `CustomerAccountPanel` INLINE inside the step card (title "Sign in to attach this booking",
  sub "Your visit, confirmation, and invoice stay linked to your account."), followed by the
  contact fields once signed in. When signed in, show a slim row: avatar-dot + "Booking as {name}
  · {email}" + the prefilled contact fields below. Keep the existing can't-pass gate but it now
  happens naturally inside the step (keep the `currentStep >= 2 && !customer` guard message too).
- Right rail: below the Proceed button add ONE muted line (text-xs): signed-out → "You'll sign in
  at the Your details step."; signed-in → "Booking as {firstName}". No extra buttons in the rail.
- The header Sign-in dialog stays unchanged.

### 24.2 Phone field: stop the duplicated +84 prefix
`src/lib/phone.ts` + `src/components/MobileWhatsappField.tsx`:
- Add `toLocalDigits(raw: string, region: "65" | "84"): string` in phone.ts and use it in BOTH the
  field's input onChange and `toSgMobileLocal`. Rules (length-aware, never blind-strip):
  digits = raw.replace(/\D/g,""); maxLen = region==="84" ? 9 : 8;
  1) if digits starts with region code AND digits.length > maxLen → strip the region code once
     (handles paste of "+84 84 914 9548" / "6591234567");
  2) then if region==="84" and digits starts with "0" and digits.length > maxLen-? → strip ONE
     leading 0 only when digits.length === 10 (local 0-format);
     for region 65 leading 0 is invalid → just cap;
  3) cap at maxLen. NEVER strip "84" from a 9-digit VN local (carrier 084 numbers legitimately
     start with 84).
- On region switch, recompute via toLocalDigits from the raw stored value (no slice(3) tricks).
- Show live validation: when local length == maxLen but isValidSgMobile is false, show the field
  error immediately (not only on submit).
- Add grouped DISPLAY formatting helper `formatPhoneDisplay(value)` (e.g. "+84 912 345 678",
  "+65 8123 4567") and use it where the account page/admin shows the phone; storage stays
  normalized `+84XXXXXXXXX`.

### 24.3 Admin blocked dates: shadcn date picker, no native input
`src/components/pages/AdminPage.tsx` BlockedDatesPanel: replace `<input type="date">` (native
dd/mm/yyyy popup, off-brand) with the SAME pattern as the booking Date step: shadcn `Popover` +
`Calendar` (`src/components/ui/popover.tsx`, `ui/calendar.tsx`) triggered by a pill Button showing
the picked date ("Thu, 10 Jul 2026") or "Pick a date"; disable past dates; keep the Reason Input
and Add button as-is. Serialize with the local-date helper (NEVER toISOString) to keep YYYY-MM-DD.

### 24.4 One active booking at a time (temporary business rule)
- API `apps/api/src/booking/booking.controller.ts` POST /api/bookings: after resolving
  `customer_user_id`, query for an existing booking of that customer where NOT
  (status = 'cancelled' OR payment_status = 'paid'). If found → 409
  `{ message: "You already have an active booking. AE finishes it before a new request can be placed — check Your bookings for status." }`.
- BookingPage: when signed in, if the customer already has an active booking (reuse the customer
  bookings fetch), show a notice card above the wizard ("You have an active booking — {service} on
  {date}. AE completes it before a new one can be placed." + button "View my booking" opening the
  account dialog) and disable submit; ALSO handle the 409 response gracefully with the same message.

### 24.5 Invoice shows ONLY via WhatsApp chat (customer side)
`src/components/BookingStatusTimeline.tsx`:
- REMOVE the inline `<InvoiceView …/>` (and its import). At `invoiceReady`, render instead a
  compact gold info panel: "Invoice {invoiceNo} · {amount} — AE sends your invoice link via
  WhatsApp. Pay by PayNow using reference {invoiceNo}." No QR, no line items, no print button in
  the account modal, #signin account column, or booking-result rail.
- Keep: the public tokened `#invoice` route rendering full InvoiceView (that is the link inside
  the WhatsApp message) and ALL admin-side invoice UI. Grep that CustomerAccountDialog/SignInPage
  no longer pull InvoiceView through the timeline.

### 24.6 QA gate
- typecheck:web + build (web+api) pass. API smoke: signup → booking #1 OK → booking #2 → 409 with
  the exact message; confirm→complete→invoice lifecycle unchanged; public #invoice link still
  renders; account timeline shows the gold "via WhatsApp" panel and NO invoice table/QR.
- Code checks: no floating sign-in card above WizardProgress; step-4 inline auth; no
  `input type="date"` left in AdminPage; `toLocalDigits` used by the field; no InvoiceView import
  in BookingStatusTimeline. You cannot screenshot — list what needs visual verification.

---

## Phase 25 — Services page: fix broken image fills, panel voids, and typography scale

User screenshots show: (a) subscription hero image leaves a big cream gap under it, (b) the
Post-Renovation green panel has a giant empty void between description and checklist, (c) heading
sizes are inconsistent across the three service sections (48/58/54px) and feel off-brand. Reviewer
already swapped the image URLs (moveHero=boxes-by-window, renovationBefore=mid-renovation room,
renovationReport=clean living proof, moveBefore/subscriptionBefore done earlier) — do NOT change
any `serviceImages` URLs. All work is in `src/components/pages/ServicesPage.tsx` layout/typography.

### 25.1 Image fill bug (subscription hero + all fixed-height imgs)
The pattern `img h-[360px] sm:h-[460px]` inside a grid column that STRETCHES taller than the image
leaves a bg-cream gap (user screenshot). Fix pattern for the subscription hero (~L125-127), the
move hero (~L206-208), and the renovation hero (~L258-260): give the wrapper the height behavior
(`h-full min-h-[320px]` on lg) and the img `h-full w-full object-cover` so the photo always fills
the card exactly — zero visible bg-cream strip at 1024/1280/1440 and stacked mobile keeps a fixed
aspect (e.g. `aspect-[4/3] lg:aspect-auto`).

### 25.2 Panel voids
- PostRenovationSection left panel (~L239): replace `content-between` with `content-start`; the
  keyPoints grid follows the description with `mt-2` inside the normal flow. Then stop the void:
  the two-column grid gets `lg:items-start` and the left panel `lg:sticky lg:top-24` OR simply
  self-start height-fit — the green block must never render more than ~80px of empty space below
  its last child at 1280.
- MoveOutSection navy panel (~L186): same treatment (`content-start`, chips right after the
  description, Book button last with `mt-2`); section grid `lg:items-start`.
- Keep all copy unchanged.

### 25.3 Typography scale (consistent, cleaning-brand friendly)
Across ServicesPage only: unify the three service h2 to `text-[34px] lg:text-[44px]` leading-tight
(currently 38/48, 40/58, 38/54 — jarring); section h3 `text-[26px]`; body/captions stay 14-16px
with leading-6/7; price displays unify to `text-[38px]`; eyebrows stay 12-13px uppercase semibold.
Nothing bigger than 44px on this page. Keep font-display (Figtree) weight normal per design law.

### 25.4 QA gate
- typecheck:web + build pass; no layout change on other pages.
- Reviewer screenshots at 390/768/1280: no cream gap under any hero img, no >80px void in the
  green/navy panels, headings visually consistent across the three sections.

---

## Phase 26 — UI de-clutter batch: booking-option modal close, step-1/step-4 cards, pricing cards, cursor

User screenshots show 6 UI issues. Reviewer already fixed (do NOT redo): phone +65/+84 leaking into
the input, and the red "Confirm cleaning duration" banner. Backend untouched this phase.

### 26.1 `src/components/BookingOptionDialog.tsx` — "Book instantly online" never closes
`<a href={bookingHref}>` doesn't re-navigate when the user is ALREADY on #booking → dialog stays
open. Make the Dialog controlled (`open` + `onOpenChange`); the online button closes the dialog in
onClick and then sets `window.location.hash` to the booking href; Chat with AE keeps target=_blank
but also closes.

### 26.2 Booking step-1 service cards — too noisy (user: "rối quá")
In `src/components/BookingPage.tsx` service option cards, reduce each card to exactly:
icon + "Most popular" badge row (radio top-right) → title → ONE price line (semibold, primary-ink,
e.g. "from S$25/hr" / "from S$300") → ONE muted desc line (truncate to one sentence) → ONE muted
footnote (hourly: "3 hrs S$75 · 4 hrs S$100"; packages: "Quoted by home size" / "Dust-reset
package"). DELETE the check-bullet rows ("Same cleaner where available", "Final quote confirmed by
AE") from the cards — they repeat elsewhere. Keep equal heights (flex-col, min-w-0), selected =
border-primary + bg-primary-soft. Center nothing except the icon row; text left-aligned.

### 26.3 Booking step-4 — redundant stacked headings (user: "rối quá confusing")
Step 4 currently shows: "Your details" heading + "CUSTOMER ACCOUNT" eyebrow + big "Sign in to
attach this booking" h2 + form + a bottom grey strip "Sign in or create an account to keep this
booking attached to you." Fix: keep the step title "Your details" with subtitle "Sign in or create
your account — your visit, confirmation, and invoice stay linked to it."; in the inline
CustomerAccountPanel hide the eyebrow and shrink the panel title to text-xl (add a `compact` prop
rather than restyling the shared panel globally); REMOVE the redundant bottom grey strip from step
4 (keep the guard toast only when the user actually tries to proceed unsigned). Add `noValidate`
to the CustomerAccountPanel <form> so native browser bubbles ("missing an '@'") never appear —
custom errors already exist.

### 26.4 `src/components/pages/PricingPage.tsx` — rate cards
- Feature list items must be plain rows (lucide Check + text, no background): kill any
  bg-primary-soft/60 highlight boxes behind feature text on the featured card (user calls it the
  "text reflection" bug — it reads as a rendering glitch).
- Replace the three business-speak eyebrows "Predictable monthly revenue" / "Reliable reset every
  2 weeks" / "Ad hoc residential support" with customer language: "For busy homes" / "Every two
  weeks" / "One-off refresh".
- No >80px empty vertical gap inside a rate card at ANY viewport: keep desktop bottom-alignment
  (mt-auto) but the mini price table and features should flow with gap-4; on single-column widths
  natural height (no stretch).

### 26.5 Global cursor + polish
`src/styles.css` @layer base: `button:not(:disabled), [role="button"]:not([aria-disabled="true"]), a { cursor: pointer; }`
plus `summary { cursor: pointer; }`. (User: hero buttons show no pointer on hover.)

### 26.6 QA gate
typecheck:web + build pass; grep no "Predictable monthly revenue"; BookingOptionDialog closes on
both actions (code-level: controlled state); step-1 cards contain no check-bullet list; step-4 has
no "CUSTOMER ACCOUNT" eyebrow and no bottom strip; reviewer screenshots the rest.

---

## Phase 27 — Luce-style invoice + account modal + navbar sign-out + active-booking warning + mega menu

User feedback (screenshots): the public invoice looks thin vs Luce's professional tax invoice; the
account modal is too small and cuts the timeline; customer Sign-out is buried in the modal (should
be on the navbar like admin); the active-booking notice looks like a normal card (should read as a
warning); the Services mega-menu wording is vague. Backend edits allowed ONLY where noted; do NOT
change pricing numbers, the WhatsApp invoice message format, or the pay-after-service lifecycle.

### 27.1 Invoice redesign — `src/components/InvoiceView.tsx` (Luce-parity, AE-adapted)
Rebuild the invoice document to read like a real Singapore invoice (reference: Luce tax invoice),
adapted for AE (NOT GST-registered yet, pay-after-service, PayNow + Bank Transfer only, no card):
- Header row: LEFT = eyebrow "INVOICE" + Bill-To block (customer full name + service address).
  RIGHT = company block: `AE Management Services Pte Ltd`, address `[CLIENT TO CONFIRM]`,
  `hello@ae-mgmt.com`, `UEN [CLIENT TO CONFIRM]`; below it Invoice Number (invoiceNo), Invoice Date
  (createdAt), Booking ref.
- A line "Invoice for your recent visit on {visit date}." under the header.
- Line-item TABLE with columns: Description | Qty | Unit Price | Amount (SGD). NO Tax column (no
  GST). Use lineItems (label, quantity, amount); qty defaults to 1, unit price = amount/qty.
- Totals block right-aligned: Subtotal, then **TOTAL SGD** (bold, larger). If invoice.status==='paid'
  add `Amount Paid` and `AMOUNT DUE SGD 0.00`; else `AMOUNT DUE SGD {total}` + `Due: pay by PayNow
  after this invoice`.
- Payment section (two numbered blocks, matching the WhatsApp message so they're consistent):
  `1. PayNow (preferred)` — Account Name (DBS): AE Management Services Pte Ltd, PayNow UEN:
  [CLIENT TO CONFIRM], Reference: {invoiceNo}. `2. Online Bank Transfer` — Account Name (DBS): …,
  Account Number: [CLIENT TO CONFIRM], Reference: {invoiceNo}. Then the IMPT reference note. NO
  credit-card option.
- Keep the scannable PayNow QR (right of / below payment) with caption "Scan and use {invoiceNo}".
- Footer notes: "Should you have any questions about your invoice or billing, WhatsApp us at
  +65 6980 3559." / "This is a computer-generated document. No signature is required." /
  "Company Registration No: [CLIENT TO CONFIRM]".
- Keep the Download/Print button + `.invoice-print-root` print stylesheet working; ensure NO
  horizontal scroll at 360/768/1280 and the print output is clean (single column, table scrolls
  inside its own wrapper if needed).
- DATA: InvoiceSummary currently lacks customer name + address + visit date. Extend the PUBLIC
  invoice endpoint (`GET /api/invoices/:invoiceNo?token=` in apps/api/src/booking/booking.controller.ts
  — customer_name / address / schedule_date are already on the booking row) to include
  `customerName`, `address`, `visitDate`; thread them through InvoiceSummary + BookingStatusTimeline
  props. Token security unchanged (wrong token still 404).

### 27.2 Account modal bigger — `src/components/CustomerAccountDialog.tsx`
- `DialogContent` → `w-[min(1040px,calc(100%-32px))] max-h-[88vh] overflow-y-auto` (also apply to the
  BookingPage account dialog instance) so the booking timeline is never cut.
- Rebalance `SignedInAccount`: the left identity column should be height-fit (not a tall empty box);
  make "Your bookings" the main area. Remove the big whitespace.

### 27.3 Customer Sign-out on the navbar — `src/components/Header.tsx`
- When a CUSTOMER is signed in, mirror the admin pattern: show the Account button AND a `Sign out`
  button in the header (desktop + mobile sheet), using the existing customer logout
  (forgetCustomerSession + customerSessionChangedEvent, or useCustomerSession().logout).
- Remove the Sign-out button from inside the account modal's left card (identity block keeps just
  name/email/phone). Keep admin's existing Admin + Sign out.

### 27.4 Active-booking notice → warning — `src/components/BookingPage.tsx` (~L548-560)
- Restyle to a WARNING: `border-gold bg-gold-soft`, eyebrow + heading in `text-gold-text`, add a
  lucide `TriangleAlert` (AlertTriangle) icon; keep the "View my booking" button but make it
  `variant="secondary"` so it doesn't read as a primary CTA. Copy stays.
- Since a new booking is blocked, visually de-emphasize the wizard below when
  `activeCustomerBooking` is set: wrap the wizard+summary grid with `opacity-60 pointer-events-none
  select-none` and `aria-hidden`, so the warning is clearly the actionable thing. (The submit was
  already blocked server-side; this makes it obvious.)

### 27.5 Services mega-menu polish — `src/components/Header.tsx` (~L433-434)
- Replace vague group copy: "Cleaning Services / Residential scopes" → "Our cleaning /
  Homes we clean"; "Plans & Support / Rates and account help" → "Pricing & help / Rates,
  booking, account". Ensure the flyout panel has consistent padding, no text clipping, hover state
  uses primary-soft (not a hard green outline), and the descriptions never wrap awkwardly at 1024+.

### 27.6 QA gate
typecheck:web + build pass; public invoice URL renders the new layout with customer Bill-To +
payment blocks + QR, wrong token still 404; account modal shows full timeline without clipping;
signed-in customer sees Sign out on the navbar and NOT in the modal; active-booking warning is gold
and the wizard is dimmed; mega-menu copy updated. You cannot screenshot — list what needs visual QA.

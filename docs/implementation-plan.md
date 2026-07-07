# ZestClean — Phased Implementation Plan (v2)

> Source of truth for all frontend work in this repo. Written for AI implementers (Codex):
> follow phases **in order**, complete the QA gate of a phase before starting the next,
> and keep diffs scoped to the files listed in each phase.
>
> Visual reference: https://www.zestcleaningco.com/ (light, editorial, serif-display cleaning brand).
> Design tokens below were extracted from that site's rendered DOM — do not invent new ones.
> Companion reference: `.codex/skills/okay-framer-ui/references/design-system.md`.

## 1. Product scope

ZestClean sells:

1. **Residential cleaning subscription** (weekly / bi-weekly / monthly recurring cleans)
2. **Move-in / move-out cleaning** (one-time)
3. **Post-renovation cleaning** (one-time)
4. A **simple online booking system** (request → API `POST /api/bookings` → confirmation id; no payment collection)

Stack: React 19 + Vite 7 (web, `src/`), NestJS + Fastify (API, `apps/api/`, prefix `/api`, port 3000, Vite proxies `/api`). Content is served by `GET /api/site` with a typed fallback in `src/lib/site-content.ts`.

## 2. Design system decision (open-source)

**Adopt: Tailwind CSS v4 + shadcn/ui (Radix primitives), with a custom ZestClean theme. Remove Shopify Polaris entirely.**

| Option | Verdict | Why |
|---|---|---|
| **shadcn/ui + Tailwind v4** ✅ | **Adopt** | MIT. Components are copied into `src/components/ui/` so we own the code and can style them 1:1 to the Zest look (serif display + pill buttons — impossible to express in a locked theme). Built on Radix = accessible Select/Checkbox/RadioGroup/Popover for the booking form; Calendar via react-day-picker. First-class Vite + React 19 + Tailwind v4 support. Best-documented system for AI implementers. |
| Shopify Polaris (current) ❌ | **Remove** | Admin design system, brand-locked to Shopify's look, huge global CSS, fights the warm editorial brand. Already leaking dev artifacts into UI ("Shopify flow", "Polaris pricing surface" badges). |
| Radix Themes | No | Ships its own visual language; overriding it to a bespoke serif marketing brand is fighting the framework. We use raw Radix *primitives* via shadcn instead. |
| Mantine / Chakra / HeroUI | No | Batteries-included aesthetics, heavier retheme cost, no benefit over shadcn here. |
| daisyUI | No | Fine for prototypes; weaker form/date primitives for the booking flow. |
| Keep hand-rolled CSS only | No | The current 3,200-line `styles.css` is where most bugs live; no a11y primitives for booking. |

**Fonts (open source, exactly what the reference site uses):**
- Display serif: **Fraunces** (`@fontsource-variable/fraunces`) — weight 400 for ALL headings, italic for emphasis words.
- UI sans: **Plus Jakarta Sans** (`@fontsource-variable/plus-jakarta-sans`) — weights 400/500/600.
- Remove `@fontsource/manrope`.

**Icons:** keep `lucide-react` (shadcn's default).

## 3. Design tokens (extracted from zestcleaningco.com)

```css
/* Color (hex values measured from the live site) */
--zc-ink:        #16191A;  /* headings, body base — text colors are ink at 55/65/80% alpha */
--zc-paper:      #FAFAF8;  /* "white" section background */
--zc-cream:      #F4F2EC;  /* alternating warm section background */
--zc-white:      #FFFFFF;  /* cards */
--zc-mint:       #E9F3EE;  /* tag pills, badge backgrounds */
--zc-mint-300:   #A9E2C4;  /* italic emphasis on dark hero */
--zc-green-600:  #2D9B6F;  /* primary buttons, "Most popular" pill */
--zc-green-700:  #1C6549;  /* eyebrows, links, light-bg emphasis text */
--zc-green-900:  #174F3A;  /* deep accents (eco card heading) */
--zc-forest:     #123B2C;  /* featured pricing card bg, CTA band, hero scrim base */
--zc-gold:       #E8A33D;  /* review stars */
--zc-line:       rgba(22, 25, 26, 0.08);  /* hairline borders */

/* Type (Fraunces = display, Plus Jakarta Sans = everything else) */
--text-display:  clamp(2.75rem, 6vw, 5.5rem);   /* h1 hero, line-height 1.02 */
--text-h2:       clamp(2.25rem, 4.2vw, 3.75rem); /* section titles, line-height 1.05 */
--text-h3:       1.5rem;                          /* card titles (featured cards up to 2.25rem) */
/* Body 16–18px / 1.6. Eyebrow: 14px, 600, uppercase, letter-spacing 0.08em, --zc-green-700 */

/* Shape */
--radius-pill:   9999px;  /* ALL buttons are pills */
--radius-card:   20px;    /* cards 16–22px; use 20 default */
/* Shadows: nearly none. Cards rely on 1px --zc-line borders. Max: 0 8px 24px rgb(22 25 26 / 0.06) on hover. */
```

**Type rules that define the whole look (do not skip):**
- Every `h1/h2/h3` uses Fraunces at **weight 400** (never bold — bold sans headings are the #1 way this brand breaks).
- Section h2 pattern: last 2–4 words wrapped in `<span class="text-green-700">` — **inline**, with a real space before the span (see bug B1).
- Hero h1 emphasis: `<em>` italic Fraunces in `--zc-mint-300`.
- Eyebrow above every section title, e.g. `WHY ZEST`, `SERVICES`, `PRICING`.

## 4. Bug register (current state → root cause → fixed in phase)

| # | Bug (verified by rendered screenshot) | Root cause | Phase |
|---|---|---|---|
| B1 | Headings render run-in: "…a cleaning **serviceyou** can…", "your **homeneeds.**" | JSX `<span>` inside h2 with no space before it; CSS only sets color, not display | P2 |
| B2 | **Hero headline/sub/meta invisible at ≤768px** (white text on cream — photo doesn't back the copy on mobile) | No scrim overlay behind hero copy; gradient fades to page too early | P2 |
| B3 | Nav wraps into 2 messy rows <1024px; no mobile menu | No hamburger/sheet; 7 links + phone + CTA can't fit | P1 |
| B4 | Hero bottom trust row unreadable over light photo areas (desktop too) | White text without scrim | P2 |
| B5 | "Why Zest" section: eyebrow orphaned far-left, heading squeezed right | `.home-proof-copy` is `grid-template-columns: 1.1fr 0.74fr` and its two children are Eyebrow + h2 — they split into the columns | P2 |
| B6 | Featured service card = huge empty white area; bento missing "Easy Booking" + "Eco-Friendly Options" cards | Card forced tall with no image; incomplete grid | P2 |
| B7 | "MOST BOOKED" chip is pale blue (off-palette) | Ad-hoc color | P2 |
| B8 | Headings are bold Manrope sans — zero brand personality vs reference serif | `--font-serif: var(--font-sans)` alias; `font-weight: 700` on h2 | P0 |
| B9 | Buttons are 8px-radius rectangles; reference is full pills; CTA green is near-black | Old "Framer" token `--radius-control: 8px`, `--forest #0b3d1a` used as button bg | P0 |
| B10 | Home page ends after Services; How It Works / Pricing / Testimonials / Contact are separate hash "screens"; anchor nav scrolls to top instead of to a section | `renderActiveScreen` switch + `window.scrollTo(top)` on every hash change | P1 |
| B11 | Shopify admin components + literal dev badges ("Shopify flow", "Polaris pricing surface") visible in consumer UI | Polaris used for Pricing/Booking/Contact | P0/P3 |
| B12 | Invalid HTML: `<span>` (Stack/Cluster) wraps `<h1>/<h2>/<p>/<div>`; generic `Container` renders `<article>`; `<section id="root">` in index.html | Wrong elements in `src/components/ui.tsx` and `index.html` | P0 |
| B13 | Header is `position: fixed` with `pointer-events: none` hack; always light-blurred | No scroll-state handling | P1 |
| B14 | Footer is a dark-green mini-bar; reference is a light 4-column footer | Not built | P1 |
| B15 | Booking date can be off-by-one for UTC+ timezones | `toISOString().slice(0,10)` on local dates | P3 |
| B16 | Dead/duplicate code: second `BookingSection` + fake calendar (hardcoded "May 2024", 35 cells) in `HomeSections.tsx`; fake carousel dots in Testimonials | Leftovers | P2/P3 |
| B17 | Codex produced dark-Framer UI on a light brand | `.codex` skill said "dark product surface by default" — now rewritten; always read the skill + this plan first | done |

## 5. Information architecture (target) — MULTI-PAGE (updated 2026-07-07, supersedes the earlier single-page IA)

The site is **multi-page** via hash routes. Each nav item is a real page with its **own distinct
layout** (same token system, different composition — no page may be a clone of another). Booking
stays a dedicated flow page.

```
#home           Home            — flagship: photo hero + teaser versions of everything
#about          About Us        — story, collage, stats band, values
#services       Services        — alternating deep-dive rows + add-ons + checklist accordion
#pricing        Pricing         — toggle + plan cards + comparison + pricing FAQ
#how-it-works   How It Works    — vertical timeline + first-visit expectations + FAQ
#reviews        Reviews         — rating summary + quote grid
#contact        Contact         — split info/form panel
#booking        Booking         — form + sticky summary (CTA target, not in the nav list)
```

Nav items (update BOTH `src/lib/site-content.ts` and `apps/api/src/content/site-content.ts` — they must stay in sync):
`Home #home · About Us #about · Services #services · Pricing #pricing · How It Works #how-it-works · Reviews #reviews · Contact #contact` + right-side CTA `Book Now → #booking`.

Routing rules in `App.tsx`:
- Route registry `hash → PageComponent` (default `#home`). On hash change: render the page and `scrollTo(0,0)` (auto). In-page anchors (e.g. `#pricing-faq`) may exist inside a page but nav routes are pages.
- Per-route `document.title`: `"<Page> — ZestClean"`, Home = `"ZestClean — Bay Area home cleaning"`.
- Header is transparent-over-hero **only on #home at scrollY≤24**; every other page renders the solid white header from the start.
- Keep the `/api/site` fetch + fallback exactly as is.

Home sections built in Phase 2 are the building blocks: they stay on Home as the flagship
composition, and their full-depth variants move to/get built on the dedicated pages in Phase 2B.

---

## Phase 0 — Foundations: tokens, fonts, Tailwind + shadcn, semantic fixes

**Goal:** the design system exists in code; Polaris and Manrope are gone; base HTML is valid. No layout redesign yet.

1. Packages:
   ```bash
   npm i tailwindcss @tailwindcss/vite @fontsource-variable/fraunces @fontsource-variable/plus-jakarta-sans
   npm i class-variance-authority clsx tailwind-merge   # shadcn deps
   npm rm @shopify/polaris @shopify/polaris-icons @fontsource/manrope
   ```
2. `vite.config.ts`: add `tailwindcss()` plugin and `resolve: { alias: { "@": "/src" } }`. `tsconfig.base.json`: add `"baseUrl": "."`, `"paths": { "@/*": ["./src/*"] }`.
3. `src/styles.css`: replace the `:root` token block with `@import "tailwindcss";` + `@theme` block defining the Section-3 tokens (`--color-ink: #16191A;` … `--font-display: "Fraunces Variable", Georgia, serif; --font-sans: "Plus Jakarta Sans Variable", system-ui, sans-serif;`). Keep legacy component CSS below it temporarily — phases 1–3 delete it section by section; **Phase 4 removes the last of it**.
4. `src/main.tsx`: import the two fontsource variable css files; remove Manrope + Polaris style imports.
5. `npx shadcn@latest init` (style: new-york, base: neutral, CSS variables: yes), then:
   `npx shadcn@latest add button input textarea label select checkbox radio-group calendar popover accordion badge separator card sheet sonner`
   Restyle `button.tsx` variants once, centrally: `rounded-full`, default h-12 px-6, `default` = `bg-green-600 text-white hover:bg-green-700`, `secondary` = white + `border-line`, add `ghostOnDark` = `bg-white/10 border border-white/25 text-white backdrop-blur`.
6. `src/components/ui.tsx` semantic fixes (keep exports so pages compile): `Stack`/`Cluster` render `<div>` (never `<span>`); `Container` renders `<div class="mx-auto w-[min(1200px,calc(100%-48px))]">`; delete `DatePickerShell`/`ContactPanel` when their last usage dies (P3/P2).
7. `index.html`: `<section id="root">` → `<div id="root">`; title `ZestClean — Bay Area home cleaning`; keep meta description.

**QA gate:** `npm run typecheck:web && npm run build` pass; app renders with new fonts (headings visibly serif); zero Polaris imports remain (`grep -r "@shopify" src/ apps/` → empty); no `<span>` wrapping block elements (inspect DOM of Home).

## Phase 1 — App shell: header, footer, single-page IA

**Goal:** navigation works at every width; Home is one scrolling page.

**Header (`src/components/Header.tsx` rewrite):**
- Fixed top, h-[72px], `z-40`. Two visual states driven by `scrollY > 24` (add a tiny `useScrolled()` hook) **or** `view === "booking"`:
  - *Over hero (top of home):* transparent bg, logo + links `text-white/85 hover:text-white`, Book Now = primary pill.
  - *Scrolled / booking view:* `bg-white/90 backdrop-blur border-b border-line`, links `text-ink/80`.
- Logo lockup: leaf mark + wordmark in **Fraunces 22px** (`ZestClean` — "Zest" ink/white, "Clean" green-600), like the reference serif logo. Remove the `CLEANING SERVICES` descriptor from the header (footer keeps it).
- Desktop ≥1024px: centered nav links (14px, weight 500). Right: phone link (≥1280px only) + `Book Now` pill.
- <1024px: hamburger (lucide `Menu`) → shadcn `Sheet` (full-height, bg-paper): big Fraunces links (28px), then phone + Book Now pills. **No wrapped second row, ever** (fixes B3). Selecting a link closes the sheet.
- Delete the `pointer-events: none` CSS hack and `.site-header--booking` special-casing (fixes B13).

**Footer (`src/components/Footer.tsx`, new file; delete footer from `HomeSections.tsx`):**
- bg-paper, `border-t border-line`, py-16. 4 columns ≥1024px (stack on mobile):
  1. Brand lockup + 2-line blurb (ink/60) + Instagram/Facebook icon links (ink/45).
  2. `COMPANY` (12px eyebrow, ink/45) → nav anchors + Booking.
  3. `REACH US` → `hello@zestclean.com`, phone, `San Francisco, CA`, `Mon–Sun · 8 AM – 6 PM`.
  4. Mint pill `● Bonded & Insured · Bay Area, CA` + `© 2026 ZestClean. All rights reserved.` + Privacy/Terms links (13px ink/45).

**Routing (`src/App.tsx`):**
- Replace the `renderActiveScreen` switch: `#booking` → `<BookingPage/>`; else `<HomePage/>` (new `src/components/HomePage.tsx` composing all Home sections in Section-5 order — sections may be placeholder stubs until P2).
- On hash change: booking → `scrollTo(0,0)`; section anchors → `document.getElementById(hash)?.scrollIntoView({behavior:"smooth"})` (after first paint; `requestAnimationFrame`). Landing directly on `/#pricing` must scroll there after load (fixes B10).
- Update navItems in both content files (Section 5). Keep `NavItem.status` field for API compatibility.

**QA gate:** typecheck + build; screenshots at 390/768/1024/1440: header never wraps, sheet opens/closes, anchor links scroll to sections, footer matches spec. No content hidden under the fixed header (sections need `scroll-margin-top: 88px`).

## Phase 2 — Home sections (the core visual work)

**Goal:** Home looks like zestcleaningco.com with ZestClean content. All copy comes from `content.home`/existing content files where a field exists; hardcode the rest in components (content-API v2 is backlog).

Every section: `<section id="…" class="py-20 lg:py-28">` + `Container`. Alternate backgrounds: hero(photo) → paper → cream → paper → cream → paper → forest band → cream. Eyebrow + h2 header pattern everywhere. **Write the h2 emphasis as: `Everything your home{" "}<span className="text-green-700">needs.</span>` — the explicit `{" "}` is mandatory (fixes B1). After rendering, the heading's `textContent` must read as a correct sentence with spaces.**

**2.1 Hero (`HeroSection.tsx` rewrite, id `home`):**
- `relative min-h-[92svh] max-h-[960px] flex flex-col justify-end overflow-hidden` — photo `absolute inset-0 object-cover object-center`.
- Scrim (fixes B2/B4), two stacked overlay divs — exact values:
  `linear-gradient(90deg, rgba(10,26,19,.62) 0%, rgba(10,26,19,.30) 55%, rgba(10,26,19,.16) 100%)`
  and `linear-gradient(180deg, rgba(10,26,19,.35) 0%, transparent 30%, transparent 60%, #FAFAF8 100%)`.
  White copy must stay readable at EVERY width — at 390px the copy sits over the scrim, not over bare cream.
- Content (Container, `pb-24 pt-40`): status pill (`bg-black/35 border border-white/15 backdrop-blur text-white/90 text-sm rounded-full px-4 h-9` + green-600 dot) with `hero.eyebrow` → h1 `font-display text-[--text-display] text-white leading-[1.02] max-w-[13ch]`: `{hero.title} <em class="italic text-mint-300">{hero.emphasis}</em>` → sub `text-white/80 text-xl max-w-xl` → CTA row: primary pill `Book Your Cleaning →` (`#booking`) + `ghostOnDark` pill `Get a Quote` (`#contact`) → meta line `text-white/65 text-sm` "Bonded & insured · No contracts · Cancel anytime."
- Bottom trust bar (inside hero, above the fade): `border-t border-white/15` row of 4 items `text-white/85 text-sm`, separated by `border-l border-white/15` dividers, wrapping 2×2 <768px: `★ 4.9 average · 600+ homes` / `Bonded & insured` / `Background-checked teams` / `Eco-friendly options`.
- Delete: floating rating card + avatar row (`.rating-card`, `.avatar-row`), old `local-proof` duplicates, `proofCards`/`serviceCards` consts (move to their sections).

**2.2 Why Zest (id `why`, bg-paper):**
- Header grid ≥1024px: `grid-cols-12`; left `col-span-7`: eyebrow `WHY ZEST` **above** h2 (`Finally, a cleaning service {" "}<span>you can actually rely on.</span>`) — stacked in one flow column (fixes B5); right `col-span-5 self-end`: intro `text-ink/65 text-lg max-w-md`.
- 3 stat cards (`grid-cols-3`, 1-col mobile): `bg-white rounded-[20px] border border-line p-7` — stat line in Fraunces: number `text-5xl text-green-700` + unit as smaller raised green-600 (`4.9★`, `100%`, `2min`) → label 16/500 ink-80 → copy 14 ink-55. Reuse the existing 3 proof items' copy.

**2.3 Services bento (id `services`, bg-cream):**
- Header: left eyebrow `SERVICES` + h2 `Everything your home needs.`; right: intro + link `See full cleaning checklist →` (green-700, 14/600) → scrolls to `#pricing` for now.
- Bento, desktop `grid gap-5` with areas (single column on mobile, featured first):
  ```
  "featured deep   deep"
  "featured move   vetted"
  "easy     eco    eco"      /* grid-template-columns: 5fr 4fr 3fr */
  ```
- Card base: `bg-white rounded-[20px] border border-line p-7 transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgb(22_25_26/0.06)]`. Icon = lucide in a 40px mint rounded-xl tile, green-700 stroke.
- **featured** (Recurring Cleans, fixes B6): mint eyebrow row `● MOST BOOKED` (mint pill, green-700 text — fixes B7), h3 Fraunces 36, copy, 3 mint tag pills (`Same team · Flexible cadence · Auto-billed`, each with 6px green-600 dot), then `zestclean-cleaner-kitchen.png` filling the remaining card bottom (`mt-auto -mx-7 -mb-7 rounded-b-[20px] object-cover min-h-[220px]`) — **no empty white area**.
- deep = Deep Cleans (h3 30) · move = Move In / Out · vetted = Vetted Pros (compact, 14px copy) · easy = Easy Booking ("Online in under two minutes. Reschedule from your phone.") · eco = Eco-Friendly Options: `bg-[#EAF4EE]`, heading green-900, leaf icon, vertically centered.
- Below grid: trust row `TRUSTED BY HOMEOWNERS IN` + the 5 `trustRow` cities as ink/55 items. Delete the alternating Building2/Sparkles icon logic — one `MapPin` size 14 for all.

**2.4 How It Works (id `how-it-works`, bg-paper, NEW component):**
- Centered eyebrow `HOW IT WORKS` + h2 `A clean home in <span>three steps.</span>`.
- 3 columns (stack mobile): numeral circle `size-[72px] rounded-full bg-white border border-line grid place-items-center font-display text-3xl` + dotted connector between circles ≥1024px (`border-t-2 border-dotted border-ink/15`, absolutely positioned, hidden mobile) → h3 Fraunces 24 → copy ink/65.
- Copy: **Book Online** "Pick your service, date, and frequency. Instant confirmation — no callbacks or phone tag." / **We Show Up** "A vetted cleaner arrives on time, fully equipped, ready to work to your checklist." / **Enjoy Your Home** "Relax. We handle the rest — every time, on your schedule."

**2.5 Pricing (`PricingSection.tsx` rewrite — Polaris-free, id `pricing`, bg-cream):**
- Centered header: eyebrow `PRICING`, h2 `Simple, <span>transparent pricing.</span>`, sub ink/65 18.
- Billing toggle (replaces Polaris ButtonGroup): pill segmented control `bg-white border border-line rounded-full p-1`; active segment `bg-forest text-white rounded-full h-10 px-5`; options from `pricing.billingOptions`; keep the ×0.9 subscription math. `aria-pressed` on segments.
- 3 plan cards from `pricing.plans` (`lg:grid-cols-3`, gap-6, `items-stretch`):
  - Card: `bg-white rounded-[22px] border border-line p-7 flex flex-col`. Head row: name Fraunces 24 + right tiny uppercase tag ink/45 11px (`capacity` shortened). Description ink/55 14. Price row: Fraunces 48 `${adjustedPrice}` + suffix 14 ink/55. `Separator`. Feature list: lucide `Check` 16 green-600 + 14px labels. CTA pill at `mt-auto`: `Build this booking → #booking`.
  - **Featured (Deluxe):** `bg-forest text-white border-transparent lg:scale-[1.03] shadow-xl relative`; floating pill centered at `-top-4`: `bg-green-600 text-white text-sm rounded-full h-8 px-4` `● Most popular`; muted text → white/70, checks → mint-300, CTA = `bg-white text-ink`.
- Footnote center ink/55 14: "Final price based on home size. Get an exact quote in seconds." + centered primary pill `Get my quote →` → `#booking`.
- **Delete**: Polaris comparison matrix + `getComparisonCell` (invented data), Polaris add-on cards (add-ons live in the booking flow), `apiState` chip ("Live/Fallback pricing" — dev state, never render it).

**2.6 Reviews (id `testimonials`, bg-paper; extract from `HomeSections.tsx`):**
- Centered eyebrow `REVIEWS` + h2 `Loved by homes <span>across the Bay.</span>` + sub.
- 3 cards: `bg-white rounded-[20px] border border-line p-7`: 5 gold stars (16px) → quote 17 ink/80 leading-relaxed → `— name, city CA` (name 600 ink, city ink/55 14). Reuse existing `reviews` data. **Delete fake carousel dots** (B16).

**2.7 CTA band (NEW, before contact):**
- Container-width `rounded-[28px] bg-forest text-white px-8 py-16 lg:py-20 text-center`:
  h2 Fraunces `Come home <em class="italic text-mint-300">to clean.</em>` → sub white/75 → primary pill `Book Your Cleaning` + `ghostOnDark` pill `Call (415) 855-0198` (tel:).

**2.8 Contact (id `contact`, bg-cream; rewrite `ContactSection` Polaris-free):**
- 2 cols ≥1024px: left = eyebrow `CONTACT` + h2 `We're here to help.` + 4 icon rows (phone / mail / hours / area, lucide 18 green-700, ink/80). Right = form card `bg-white rounded-[22px] border border-line p-7`, shadcn fields: Service (Select, 3 services), Name + Phone (2-col), Email, Message (Textarea 4 rows), submit primary pill `Send request` with loading state.
- Keep the existing `POST /api/contact` submit logic verbatim (state machine idle/submitting/success/error); render success/error as a mint/red-tinted inline alert div. Delete the fake map placeholder.

**Also in P2:** delete dead `BookingPreviewSection` + duplicate `BookingSection` from `HomeSections.tsx` (B16); split remaining `HomeSections.tsx` into one file per section; delete each section's legacy CSS from `styles.css` as it's rebuilt.

**QA gate:** typecheck + build; full-page screenshots 390/768/1024/1440 compared against the reference for: serif headings everywhere, correct sentence spacing (grep rendered text for `serviceyou|homeneeds` → must not exist), hero copy readable at 390px, bento has no empty regions, pricing featured card is dark green with floating pill. No horizontal scroll at 320px.

## Phase 2B — Multi-page expansion (each page its own layout)

**Goal:** the 7 marketing pages exist as distinct, polished layouts; Home becomes the flagship
overview. Reuse Phase 2 section components as cores; never clone a whole page layout twice.
Aim high visually — this is the "make it beautiful" phase: every page gets ONE signature layout
moment (listed below), all inside the token system. Copy not in the content files is hardcoded
in components (content-API v2 stays backlog).

**Shared page scaffolding (build once, `src/components/page/`):**
- `PageHero`: compact hero for subpages — bg-cream (or bg-paper, alternate per page), py-24,
  centered or left-aligned: eyebrow + Fraunces h1 (text-h2 scale) with green emphasis span +
  1-line sub (ink/65). NO photo (Home keeps the only photo hero).
- `CtaBand`: the Phase 2.7 forest band as a reusable component (props: title/sub/primary/secondary) — every page ends with it (vary the copy per page).
- Route registry in `App.tsx` per Section 5 (registry + per-route title + scroll-to-top).
- Update navItems in BOTH content files to the 7-page list (`#reviews` replaces `#testimonials`).
- Files: one component per page in `src/components/pages/` (`AboutPage.tsx`, `ServicesPage.tsx`, …) composing section components from `src/components/sections/`.

**Home (#home) — recompose as flagship:** photo hero → Why Zest stats → services bento
(teaser; card links + "See all services →" → `#services`) → How It Works condensed (3 columns,
link → `#how-it-works`) → pricing teaser (the 3 cards only, toggle lives on the Pricing page;
"See full pricing →" → `#pricing`) → reviews strip (3 quotes, link → `#reviews`) → CTA band.
The Phase 2 contact section MOVES to the Contact page (Home footer covers contact info).

**About Us (#about):** PageHero (`ABOUT US` / `A local team <span>that cares.</span>`).
1. Story split: left photo collage — `zestclean-cleaner-kitchen.png` large + `zestclean-hero-living-room.png` small overlap + mint tile with leaf icon `Clean home / Happy life` (restyle of the old AboutSection collage, rounded-[20px], no round-seal); right: story copy (2 paragraphs, ink/65) + mint chips (`Locally owned · Insured · Since 2021`).
2. **Signature: forest stats band** — full-width bg-forest rounded-[28px] container, 3 Fraunces stats in mint-300 (`2,000+ homes · 100% satisfaction · 5+ years`) with white/70 labels.
3. Values grid: 4 white cards (Trust & vetting / Consistent teams / Eco products / Detail obsession) — lucide icon tile + h3 Fraunces 20 + 14px copy.
4. Eco strip: bg-mint rounded-[20px] row — Leaf icon, green-900 heading, copy, `Plant-based · Kid & pet safe` chips.
5. CtaBand.

**Services (#services):** PageHero (`SERVICES` / `Everything your home <span>needs.</span>`).
1. **Signature: alternating deep-dive rows** for the 3 core services (Residential Subscription / Move-In-Out / Post-Renovation): image-or-mint-panel one side, content the other (eyebrow chip e.g. `MOST BOOKED`, h2 Fraunces 30, copy, 4 check bullets from `booking.services[].highlights`, `From $X` Fraunces + `Book this clean →` pill → `#booking`). Alternate left/right; panel alternates photo / bg-mint with big lucide icon.
2. Add-ons grid: mint chip-cards from `pricing.addons` (name + `+$X` badge).
3. Cleaning checklist: shadcn Accordion, 4 items (Kitchen / Bathrooms / Bedrooms / Living areas), each a 2-col checklist of 6 short items.
4. Guarantee strip (white card, ShieldCheck, satisfaction copy) → CtaBand.

**Pricing (#pricing):** PageHero (`PRICING` / `Simple, <span>transparent pricing.</span>`).
1. Billing toggle + 3 plan cards (the Phase 2.5 pricing section verbatim — it moves here; Home keeps cards-only teaser without toggle).
2. What's-included table: simple 3-col × 6-row check table built from `plans[].features` (lucide Check green-600 / Minus ink-25), white card, hairline row dividers. NO invented data.
3. Add-ons price list (same data as Services page, denser list style).
4. **Signature: pricing FAQ** — shadcn Accordion, 4 Qs (How is the exact price set? / What if I'm not happy? / Do I need to be home? / Can I pause my subscription?) with 2-3 sentence answers.
5. Footnote + CtaBand (`Get my exact quote` primary → `#booking`).

**How It Works (#how-it-works):** PageHero (`HOW IT WORKS` / `A clean home in <span>three steps.</span>`).
1. **Signature: vertical timeline** — 3 rows: left rail with Fraunces numeral circles (72px) joined by a dotted vertical line; right content: h3 Fraunces 24 + copy + one mint mini-chip each (`~2 min · Same team · No follow-up needed`).
2. First-visit expectations: 3 white cards (Arrival window & walkthrough / Supplies included / Post-clean checklist review).
3. Policies row: 3 mint chips (Free reschedules 24h+ / Cancel anytime / Satisfaction guarantee).
4. FAQ accordion (4 Qs: keys/access, pets, supplies, rescheduling) → CtaBand.

**Reviews (#reviews):** PageHero (`REVIEWS` / `Loved by homes <span>across the Bay.</span>`).
1. **Signature: rating summary card** left (white, rounded-[22px]: Fraunces 64px `4.9`, 5 gold stars, `from 2,000+ reviews`, mint chip `100% background-checked teams`) + intro copy right.
2. Quote grid: 6 review cards in 3 cols (reuse Phase 2.6 card style; write 3 additional realistic quotes — new names/cities: Marin, Daly City, San Mateo).
3. Trust badges row (Bonded & insured / Background-checked / Eco-friendly — lucide + ink/65) → CtaBand.

**Contact (#contact):** PageHero (`CONTACT` / `We're here <span>to help.</span>`).
1. **Signature: split panel** — one rounded-[28px] container split 5/7: left bg-forest text-white (contact rows with mint-300 icons: phone / email / hours / `San Francisco, CA`, + service-area chips: SF, Oakland, Berkeley, Alameda, Piedmont in white/10 pills); right bg-white: the Phase 2.8 form (Service select, Name+Phone, Email, Message, submit pill, existing POST /api/contact logic).
2. Below: 3 small info cards (Response within 1 business day / Mon–Sun 8–6 / Bonded & insured) → CtaBand variant with `tel:` secondary.

**Also in 2B:** Header active state highlights the current page (`aria-current="page"` + mint pill,
already supported); delete Home's contact section import; keep `#testimonials` → `#reviews` redirect
(if an old hash arrives, map it in the registry).

**QA gate:** typecheck + build; screenshot EVERY page at 390 and 1440 (16 shots): each page has a
distinct layout, PageHero renders, CTA band present, no run-in headings, no horizontal scroll,
header solid on subpages / transparent on Home top, per-route document.title correct.

## Phase 3 — Booking flow rebuild (`BookingSection.tsx` → `BookingPage.tsx`, Polaris-free)

**Goal:** same booking capability, ZestClean-styled, no Polaris. **API contract unchanged** (`POST /api/bookings`, same JSON body — do not touch `apps/api`).

- Page header (bg-cream, compact): eyebrow `BOOK ONLINE` + h2 `Book your clean <em>in just a few clicks.</em>` + sub + 3 assurance chips (mint pills: `Secure request · 2-minute setup · No hidden fees`).
- Layout ≥1024px: `grid grid-cols-[1fr_380px] gap-6 items-start`; mobile: single column, summary last.
- Left column cards (`bg-white rounded-[22px] border border-line p-6`, h3 Fraunces 20 + step Badge):
  1. **Service** — shadcn `RadioGroup`, each option a selectable card row (name + badge `Most Popular` + description + `From $X` right-aligned; selected = `border-green-600 bg-[#F4FAF7]`). Changing service resets `frequency` to the service's first option.
  2. **Date & time** — shadcn `Calendar` (`disabled={{ before: new Date() }}`) + time slots as pill toggle buttons (`aria-pressed`, selected = forest bg white text).
  3. **Home details** — Selects: Frequency (from selected service), Home type, Bedrooms, Bathrooms; Address `Input` full-width, required.
  4. **Add-ons** — checkbox cards 2-col (name + `+$X` + description); toggling updates total.
  5. **Contact & payment** — Name/Phone/Email/Notes inputs + payment `RadioGroup` (keep both options + helpText).
- Right: **sticky summary** (`lg:sticky lg:top-24`): rows (Service / Frequency / Home / Date & time / Add-ons / Payment) → Separator → `Est. total` in Fraunces 40 green-700 → primary pill `Create Booking` (loading state) → status: success = mint alert with booking id, error = `#FFF3ED`/`#8A321D` alert (keep existing fetch + message logic) → 3 assurance rows from `booking.assurances`.
- **Date correctness (B15):** all date↔string conversion via local-time helpers — never `toISOString` on picker dates:
  ```ts
  const toIsoDateLocal = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  ```
  Default visit date = today + 2 days (local). Keep the price math (`getFrequencySurcharge`, `getHomeSurcharge`) and document the surcharge constants with comments.
- Delete the `activeStep`-advances-on-every-keystroke stepper (`<ol class="booking-steps">` + all `setActiveStep` calls); the numbered card badges + summary communicate progress.

**QA gate:** typecheck + build; submit a booking against the dev API (`npm run dev`) → success shows a booking id; kill the API → error alert renders; date chosen in the calendar equals the date in the summary and in the POST body (test in a UTC+7 environment or with TZ=Asia/Ho_Chi_Minh); screenshots 390/1440.

## Phase 4 — Polish, cleanup, final QA

1. Delete every remaining legacy rule from `styles.css` (target: only `@import "tailwindcss"`, `@theme`, and ≤50 lines of bespoke CSS like the hero scrim). Delete unused assets/exports; `npm run build` must tree-shake clean.
2. Active-section nav highlight via IntersectionObserver (ink → green-700 for the section in view) — desktop only, optional if time-boxed.
3. Motion (restrained): one shared `useReveal` hook (IntersectionObserver → `opacity-0 translate-y-3` → `transition duration-500` in). Apply to section headers + card grids only. Respect `prefers-reduced-motion: reduce` (skip entirely).
4. A11y pass: single `h1` (hero only); sections labelled by their h2 (`aria-labelledby`); focus-visible ring `2px solid --zc-green-600 offset 2px` on all interactive elements; Sheet traps focus; color-contrast: text on mint/cream ≥ 4.5:1 (ink alphas ≥ 0.65 for body).
5. Perf: hero image `fetchpriority="high"`, bento image `loading="lazy"`; check built CSS < 60KB gz (Polaris removal alone saves ~200KB).
6. Content sync check: `src/lib/site-content.ts` ⇄ `apps/api/src/content/site-content.ts` navItems/pricing/booking identical (they are duplicated by design; a shared package is backlog).

**Final QA matrix (run before claiming done):** every route (`#home #about #services #pricing #how-it-works #reviews #contact #booking`) at 320 / 390 / 768 / 1024 / 1440 px — no horizontal scroll, no clipped/overlapping/invisible text, header + sheet usable, nav routes to the right page with correct document.title, booking round-trip works, `typecheck:web` + `build` green, console error-free, rendered headings contain no run-in words, no two pages sharing an identical layout.

---

# PART 2 — Real business pivot (added 2026-07-07 evening)

**Context (from the client chat):** this site is for **AE Management Services Pte Ltd**, a
**Singapore** residential cleaning company. The owner was **rejected from MOM's Household
Services Scheme (HSS)** and needs a credible, professional platform to (a) win real clients and
(b) support the HSS re-application. Requirements that override anything above:

- Brand: real logo at `apps/images/WhatsApp Image 2026-07-06 at 11.21.58.jpeg` — **navy + cyan
  sparkle**, tagline "Simple. Efficient. Professional." The green palette is retired.
- Market: Singapore. Currency **S$**. Strictly **residential** (HSS covers homes only — never
  imply commercial/office/Airbnb cleaning anywhere in the copy).
- Payment reality: **no payment gateway** (fees), **no cash** (owner: cleaner might keep it).
  Flow = customer books online → admin receives booking → **confirms via WhatsApp** → cashless
  payment (PayNow/PayLah QR or bank transfer; QR pending client confirmation).
- UX reference for SG market: https://www.luce.sg/services/home-cleaning (hourly rates with
  per-duration price table, "same cleaner" as the differentiator, "Why X" comparison table,
  floating WhatsApp bubble, WhatsApp-branded Book Now, pay-after-service).
- Positioning (do NOT compete on price): same cleaner every visit, replacement-cleaner
  guarantee, digital cleaning checklist, photo completion report, WhatsApp support, public
  liability & damage coverage, easy rescheduling, cashless payment.

## Pricing model (replaces the US tier model everywhere)

**Recurring home cleaning (hourly, min 3 hrs, sessions of 3 or 4 hrs):**

| Service | Rate |
|---|---|
| Weekly cleaning | **S$25/hr** (range 24–26) |
| Fortnightly cleaning | **S$27/hr** (range 25–28) |
| One-time / ad-hoc cleaning | **S$30/hr** (range 28–32) |
| Weekend surcharge (Sat/Sun) | **+S$10 flat** (range 8–15) |

Display pattern (luce-style): each plan card shows `from S$X/hr` + a mini table
(3 hrs → S$75 · 4 hrs → S$100 for weekly, etc.) + "Same dedicated cleaner every visit" on
recurring cards. Prices are **nett** — do not mention GST unless the client confirms GST
registration. All rates/phone/UEN live in ONE constants file `src/lib/company.ts` marked
`// [CLIENT TO CONFIRM]` so the owner can edit a single place.

**Move-in/out & post-renovation (one-time packages by home size, competitor range S$300–450 up to 1,300 sq ft):**

| Home size | Move-In/Out | Post-Renovation |
|---|---|---|
| Up to 700 sq ft | from S$300 | from S$380 |
| 700–1,000 sq ft | from S$360 | from S$420 |
| 1,000–1,300 sq ft | from S$420 | from S$480 |
| Above 1,300 sq ft | custom quote | custom quote |

Every package price is "from …; exact quote confirmed on WhatsApp". Cross-sell add-ons stay
(kitchen degrease, fridge/oven, bathroom deep clean, sofa/mattress extraction — add the last one).

## New bugs / gaps register

| # | Item | Phase |
|---|---|---|
| B18 | Featured bento photo overflows the card (Tailwind preflight `max-width:100%` vs `-mx-7` — img shifts left, gap right) | fixed by reviewer ✔ (keep regression check in P7) |
| B19 | **No persistence**: `POST /api/bookings` & `/api/contact` echo the request and invent an id — nothing is stored | P6 |
| B20 | Entire site is US-localized (ZestClean, Bay Area, SF cities, (415) phone, $ USD, Apartment/Townhome) — all wrong for AE Singapore | P5 |
| B21 | Booking offers "card authorization" + "invoice" payment options that don't exist; real flow is WhatsApp-confirm + PayNow/transfer | P5 |
| B22 | Stats copy ("2,000+ homes", "5+ years") is invented — a credibility risk in front of MOM; replace with defensible copy from `company.ts` placeholders | P5 |

## Phase 5 — AE rebrand + Singapore localization

**Brand tokens (swap in `@theme`; then mechanically rename usages — grep must show 0 leftovers):**

```css
--color-navy:     #1F3A66;  /* primary buttons, links, light-bg emphasis (replaces green-600/700 roles) */
--color-navy-700: #16294B;  /* hover, deep accents (replaces green-900) */
--color-navy-900: #0F1E38;  /* featured card bg, CTA band, hero scrim base (replaces forest) */
--color-sky:      #35C5F0;  /* cyan accent from the logo sparkle: pill dots, small icons, highlights */
--color-sky-100:  #E4F6FD;  /* chips/pills bg (replaces mint) */
--color-sky-300:  #9FE1F8;  /* italic emphasis on dark surfaces (replaces mint-300) */
--color-eco:      #2D9B6F;  /* ONLY for eco-product chips */
/* keep: ink, paper, cream, white, gold, line; keep Fraunces + Plus Jakarta Sans */
```

Rename map: `green-600→navy`, `green-700→navy` (eyebrows/links), `green-900→navy-700`,
`forest→navy-900`, `mint→sky-100`, `mint-300→sky-300`. Hero scrim gradients switch to navy
tints: `rgba(13,24,43,.62)` / `rgba(13,24,43,.30)` etc. WhatsApp elements may use WhatsApp
green `#25D366` (icon/bubble only).

**Brand assets:** copy the logo to `src/assets/ae-logo.jpeg`. Header lockup = logo image
(36px, rounded-lg) + wordmark `AE Management Services` (Fraunces, "AE" navy / rest ink) +
drop the descriptor in header. Footer: logo + full name + tagline "Simple. Efficient.
Professional." + legal line `AE Management Services Pte Ltd · Singapore · UEN [CLIENT TO CONFIRM]`.
Favicon: replace leaf with an "AE"/sparkle mark (simple inline SVG, navy + cyan).

**New `src/lib/company.ts`** (single source of truth, every value commented `[CLIENT TO CONFIRM]`
where placeholder): legal name, display name, tagline, phone `+65 8123 4567`, `whatsappHref`
(`https://wa.me/6581234567?text=...`), email, service hours, UEN, rates (all numbers above),
weekend surcharge, min hours, package matrix.

**Content rewrite (BOTH `src/lib/site-content.ts` AND `apps/api/src/content/site-content.ts`):**
- Brand/nav unchanged structurally; all copy re-localized: Singapore, island-wide; areas chips
  = `East · West · North · Central · CBD fringe`; homeTypes = `HDB · Condominium · Landed`;
  size tiers for packages = the 4 rows above; bedrooms/bathrooms options stay.
- Hero: `Home cleaning in Singapore <em>you can rely on.</em>` + sub about same-cleaner
  reliability; meta line `Cashless payment · Replacement guarantee · Island-wide`.
- Why section stats (B22): swap to defensible claims from company.ts: `Same cleaner, every
  visit` / `Replacement-cleaner guarantee` / `Digital checklist + photo report`.
- Services: Residential Cleaning Subscription (weekly/fortnightly hourly), Move-In/Out packages,
  Post-Renovation packages; highlights mention digital checklist & photo completion report.
- Pricing page: hourly cards (Weekly POPULAR / Fortnightly / One-Time) with luce-style mini
  price tables + weekend surcharge note + **"Why AE" comparison table** (Same cleaner ✓ /
  Replacement guarantee ✓ / Platform fee Free / WhatsApp support ✓ vs "Others") + packages
  table section + FAQ updated (payment question → PayNow/transfer after WhatsApp confirm).
- Booking flow: service picker (3 services); recurring path = frequency (Weekly/Fortnightly/
  One-time) + duration (3/4 hrs) + weekend detection from picked date (auto add S$10, show
  line item); package path = size tier select → `from S$X` + "final quote via WhatsApp" note.
  Payment preference (B21) → exactly two options: `PayNow / bank transfer — details via
  WhatsApp after confirmation` (default) and `Discuss on WhatsApp`. Estimated total shows
  breakdown lines (rate × hrs, surcharge, add-ons).
- Booking success panel: keep booking id + add primary CTA `Confirm on WhatsApp` — wa.me deep
  link prefilled `Hi AE! Booking <id>: <service>, <date> <time>, est. S$<total>. Please confirm.`
- **Floating WhatsApp bubble** on all routes (fixed bottom-right, 56px, #25D366, white icon,
  aria-label, hides on `#admin`).
- Header phone pill → WhatsApp pill (`WhatsApp us`). CTA band secondary → WhatsApp too.
- Copy audit gate: `grep -riE "zestclean|bay area|san francisco|oakland|berkeley|alameda|piedmont|\(415\)|/clean\b" src apps` → 0 hits (except git history).

**QA gate:** typecheck+build; grep audits (old colors, old brand, old cities) all 0; screenshots
of all 8 routes at 390/1440 in the new navy brand; booking estimate math spot-checked (weekly
3h weekday = S$75; weekly 4h Saturday = S$110).

## Phase 6 — Persistence + booking ops (DB + admin + WhatsApp confirm)

Node 26 ships `node:sqlite` — use it, zero new dependencies.

- `apps/api/src/db/db.service.ts`: `DatabaseSync` at `apps/api/data/ae.db` (mkdir recursive,
  add to .gitignore). Tables:
  `bookings(id TEXT PK, created_at TEXT, status TEXT DEFAULT 'received', service_id TEXT,
  service_name TEXT, frequency TEXT, duration_hours INTEGER, home_type TEXT, bedrooms TEXT,
  bathrooms TEXT, size_tier TEXT, address TEXT, date TEXT, time TEXT, addons_json TEXT,
  customer_name TEXT, customer_phone TEXT, customer_email TEXT, notes TEXT, payment_pref TEXT,
  estimated_total INTEGER)` and
  `contacts(id TEXT PK, created_at TEXT, service_type TEXT, name TEXT, email TEXT, phone TEXT,
  message TEXT, status TEXT DEFAULT 'new')`.
- `POST /api/bookings` / `POST /api/contact` → validate minimal required fields (name+phone,
  date for bookings) → INSERT → return `{id, status:"received"}`. id = `bk_`/`ct_` + timestamp
  + 4 random chars. Malformed body → 400 with message (no stack leaks).
- Admin endpoints, guarded by header `x-admin-token` matching `process.env.ADMIN_TOKEN`
  (dev default `ae-admin-dev`, document in README section of the plan):
  `GET /api/admin/bookings` (newest first), `PATCH /api/admin/bookings/:id {status}`
  (`received|confirmed|completed|cancelled`), `GET /api/admin/contacts`. Wrong/missing token → 401.
- Frontend `#admin` route (NOT in navItems, no index): token form (sessionStorage) → bookings
  table (created, service, date/time, customer + phone as `wa.me` link with prefilled
  confirmation text, est. total, status Select that PATCHes) + contacts list below. Plain
  shadcn Table/Select/Input, paper bg, no marketing chrome. Failed auth shows inline error.
- Booking POST body: add `durationHours` and `sizeTier` fields (P5 UI already collects them);
  keep old fields for compatibility.

**QA gate:** round-trip: create booking via UI → row visible in `#admin` after token login →
PATCH status to confirmed → re-GET shows confirmed; restart API (`npm run dev:api`) → data
survives (file DB); wrong token → 401 + UI error state; `sqlite3`-free (node:sqlite only);
typecheck+build.

## Phase 7 — Full-site bug sweep + hardening (user-reported: "bug UI everywhere — check everything")

1. Regression-verify every fix in the bug register B1–B22 (each has a one-line check).
2. Matrix: every route (`home about services pricing how-it-works reviews contact booking admin`)
   × 320/390/768/1024/1440 — screenshot, no h-scroll, no clipped/overlapping/invisible text,
   images cover their frames (B18-class bugs), floating WhatsApp bubble never overlaps CTAs
   (safe-area margin), sheet/accordions/toggles/calendar all operable.
3. Interaction sweep: nav (desktop + sheet), pricing toggle, all accordions, booking full
   submit (weekday + weekend, recurring + package paths), contact submit, admin login + status
   change, `#testimonials` redirect, back/forward hash navigation.
4. Copy sweep: no lorem, no US remnants, no dev/debug text, consistent `S$`, one h1 per page,
   title per route.
5. Perf/a11y: hero fetchpriority, lazy below-fold images, focus-visible everywhere, reduced
   motion honored, built CSS < 25 kB gz, console clean on all routes.
6. Output: a checklist report of every item checked + every fix applied.

## Updated backlog

- Real PayNow/PayLah QR asset on the booking success panel (client to provide).
- Transparent PNG/SVG version of the AE logo (current: white-bg JPEG).
- Real UEN + phone + email + GST status in `company.ts`.
- Cleaner scheduling, GPS/photo check-in, ratings, automated recurring bookings (ops app v2 —
  only after the cleaning operation is profitable, per the advisor note).
- Google Reviews integration, press mentions row.
- Email/WhatsApp notification automation for new bookings (currently: admin checks `#admin`).

# AE Management Services — Design System

Visual law for every public surface. Layout language borrows Luce's booking rhythm and Claude's comparison-table clarity; brand colors use the client-requested soft blue system.
The phased build order, bug register,
and per-section specs live in `docs/implementation-plan.md` — read that for WHAT to build;
read this for HOW it must look.

Identity in one line: **clear, residential, trustworthy** — light neutral pages, white cards,
Astryx neutral typography, soft blue pill buttons, yellow booking highlights, almost no shadows.
Never dark-product/dashboard styling on public pages. Never add another UI library.

Payment lifecycle is part of the UI contract: `request -> AE confirms visit -> service
completed -> invoice with PayNow/PayLah QR -> paid`. Admin confirmation is not a payment
request; invoice/QR surfaces only after the service is completed.

## Tokens

**Palette = AE soft-blue platform palette. Green is retired as the primary UI color and may appear
only for WhatsApp/eco-specific affordances.**

```css
@theme {
  --color-ink: #16191A;        /* headings + body base (body = ink at 55/65/80% alpha) */
  --color-paper: #FAFAF8;      /* light section bg */
  --color-cream: #F4F2EC;      /* warm alternating section bg */
  --color-white: #FFFFFF;      /* cards */
  --color-sky-100: #EFF6FF;    /* badges, icon tiles, selected-card tint */
  --color-sky-200: #D8E7FF;    /* borders and soft emphasis */
  --color-sky-300: #BBD6FF;    /* focus ring */
  --color-blue-600: #2563EB;   /* PRIMARY: buttons, prices, links, selected borders */
  --color-blue-700: #1D4ED8;   /* hover and emphasis text */
  --color-blue-900: #0F3B7A;   /* navy text accent */
  --color-navy-900: #082F63;   /* deep hero scrim and featured panels */
  --color-eco: #2D9B6F;        /* eco-only green */
  --color-gold: #E8A33D;       /* review stars + the ONLY attention/pending accent */
  --color-gold-soft: #FBF1DD;  /* pending surface bg */
  --color-gold-text: #7A5210;  /* pending surface text */
  --color-line: rgb(22 25 26 / 0.08);
  --color-input: rgb(22 25 26 / 0.22);

  /* type */
  --font-family-body: "Figtree Variable", Figtree, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  --font-family-heading: "Figtree Variable", Figtree, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  --font-family-code: ui-monospace, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  --font-display: var(--font-family-heading);
  --font-sans: var(--font-family-body);
  --font-heading: var(--font-family-heading);
  --font-mono: var(--font-family-code);
}
```

**Tailwind v4 syntax law:** every `--color-*` / `--text-*` / `--font-*` key in `@theme` auto-generates
its utility — write `bg-paper`, `text-blue-600`, `border-line`, `bg-navy-900`, `font-display`,
`text-display`. The v3 arbitrary-var form `bg-[--color-paper]` is **silently dead in v4** (renders
nothing) — never write it. For a raw var you must use parens: `bg-(--some-var)`.

- Section backgrounds alternate paper → cream. Cards are `#FFFFFF` with `1px solid --color-line`.
- Shadows: default none; hover max `0 8px 24px rgb(22 25 26 / 0.06)` with `-translate-y-0.5`.
- Radii: buttons/pills/chips `9999px`; cards `20px` (16–22 acceptable); CTA band `28px`.

## Typography

| Role | Font | Size | Weight | Notes |
|---|---|---|---|---|
| h1 hero | Astryx neutral Figtree | clamp(2.75rem, 6vw, 5.5rem) | **400** | line-height 1.02, white on photo |
| h2 section | Astryx neutral Figtree | clamp(2.25rem, 4.2vw, 3.75rem) | **400** | line-height 1.05 |
| h3 card | Astryx neutral Figtree | 1.5rem (featured up to 2.25rem) | **400–600** | match local component hierarchy |
| Body | Astryx neutral Figtree | 16–18px / 1.6 | 400 | color: ink 65% |
| Small/meta | Astryx neutral Figtree | 13–14px | 400–500 | ink 55% |
| Eyebrow | Astryx neutral Figtree | 14px | 600 | UPPERCASE, tracking 0.08em, blue |
| Nav links | Astryx neutral Figtree | 14px | 500 | |

Hard rules:
- Do not reintroduce old serif/sans font stacks. All public UI
  typography must resolve through the Astryx Figtree tokens in `src/styles.css`.
- Every section h2 highlights its last 2–4 words: `…your home{" "}<span class="text-blue-600">needs.</span>`
  The explicit `{" "}` before the span is mandatory — rendered text must read as a correct sentence
  (regression: "serviceyou", "homeneeds").
- Hero/CTA-band emphasis on dark: `<em>` italic Astryx/Figtree in highlight/yellow or blue token colors.
- Letter-spacing 0 everywhere except uppercase eyebrows.

## Components

**Buttons** — always pills (`rounded-full`), h-12 (44px acceptable), px-6, 15–16px/600.
- Primary: `bg-blue-600 text-white hover:bg-blue-700`.
- Secondary (light bg): `bg-white text-ink border border-line hover:border-ink/25`.
- Ghost on dark: `bg-white/10 text-white border border-white/25 backdrop-blur`.
- Focus: `outline-2 outline-offset-2 outline-blue-600` on everything interactive.

**Pills & chips** — use `bg-highlight text-highlight-text` for status/featured highlights and
`bg-sky-100 text-blue-600` for low-emphasis brand chips. Never gray-on-gray.

**Cards** — white, rounded-[20px], hairline border, p-6/7; icon = lucide 20px, blue stroke,
inside a 40px sky-100 rounded-xl tile. Featured pricing card uses soft platform blue,
white text, yellow checks, white pill CTA, floating yellow `Most popular` pill centered at top.

**Header** — fixed 72px; transparent with white links over the hero, `bg-white/90 backdrop-blur
border-b border-line` once scrolled (>24px) or off-home. Neutral wordmark. <1024px:
hamburger → full-height Sheet with Astryx/Figtree links; nav must never wrap to a second row.

**Hero** — full-bleed photo `min-h-[92svh]`, navy-900 scrim gradients so white copy is readable at
every width (390px included), bottom fade into paper, trust bar row with white/15 dividers.

**Forms** (booking/contact) — shadcn/ui components from `src/components/ui/` only (Input, Select,
RadioGroup, Checkbox, Calendar, Textarea). Visible labels, h-11 controls, white bg, visible
`border-input` borders, blue focus ring. Selected choice-cards: `border-blue-600 bg-sky-100` or
`border-blue-600 bg-gold-soft` for invoice/payment status after service completion.
Dates: convert with local-time helpers, never `Date.toISOString()`.

**Icons** — lucide-react only. No emoji in UI.

## Layout

- Container `min(1200px, 100% - 48px)`, centered. Sections `py-20 lg:py-28`.
- Anchored sections need `scroll-margin-top: 88px` (fixed header).
- Grids collapse to one column ≤768px; bento/pricing follow specs in the plan doc.
- Never render dev/debug state in public UI (API fallback chips, framework badges, fake controls).

## QA checklist (run before claiming any UI task done)

1. `npm run typecheck:web && npm run build` pass.
2. Rendered screenshots at 320 / 390 / 768 / 1024 / 1440 px.
3. No horizontal scroll; no clipped, overlapping, run-in, or unreadable text (white-on-light = instant fail).
4. Headings render with Astryx/Figtree tokens and correctly spaced emphasis spans.
5. Buttons are pills; palette matches tokens (no green outside WhatsApp/eco chips, no off-palette colors, no 8px-radius buttons).
6. Header usable at every width; mobile menu opens/closes; anchors scroll to the right section.
7. Console free of errors; `/api/site` failure falls back silently to bundled content.

## Color discipline (STRICT — added after "colors inconsistent everywhere" feedback)

Every color has ONE semantic job. Do not use a color decoratively or as a generic accent.
Audit: `bg-highlight`/yellow may appear ONLY in the pending/status files (BookingPage pending
banner, BookingStatusTimeline pending node, AdminPage "Pending" tile). Anywhere else = bug.

| Role | Token(s) | Use for | NEVER for |
|---|---|---|---|
| Brand primary | `blue-600` #2563EB | primary buttons, links, prices, selected borders, active-step text, focus ring | decoration, fills of large blocks |
| Brand soft | `sky-100` bg + `blue-600` text | badges (Most popular), icon tiles, selected-card tint, soft info surfaces | — |
| **Attention / pending** | `highlight` (yellow) | **ONLY** the "waiting for AE to confirm" states: booking pending banner, status-timeline pending node, admin Pending tile. At most one yellow element per view. | badges, feature chips, info cards, hero, pricing notes, sub-notes |
| Neutral | ink alphas + `line` borders + white/paper | body text, info cards, secondary sub-notes/chips | — |
| WhatsApp | `#25D366` | WhatsApp buttons only | anything else |
| Eco | `eco` green | eco-product chip only | anything else |

Rules:
- **Badges** are one component: `sky-100` bg + `blue-600` text, pill, 12px. A "Most popular" flag
  appears on at most ONE option in a group; don't label 2 of 3 cards "Popular" (meaningless).
- **Sub-notes** (e.g. "Same cleaner where available") are NOT filled bars — render as an inline
  row: small check icon + `text-ink/60`, or a slim neutral pill. Never a full-width color bar
  (reads as a broken button).
- **Info cards** (tips/notes like the pricing weekend note) = white or `paper` bg + `line` border +
  info icon in a `sky-100` tile. Not yellow (yellow ≠ "info", yellow = "pending").
- **Hero emphasis** on the photo must be readable at AA without yellow: white italic inside a
  `bg-navy-900/40` rounded highlight box (or solid), not the attention-yellow.
- **Steppers/labels never truncate.** Give step labels room or shorten them ("Service" not
  "Frequency/Service"); active step = `sky-100`+`blue-600`, done = `blue-600` check, upcoming = neutral.

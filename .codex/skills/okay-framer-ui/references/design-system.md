# AE Management Services — Design System

Visual law for every public surface. Layout language modeled on zestcleaningco.com; brand colors from the AE logo (navy + cyan sparkle); market patterns from luce.sg (see plan Part 2).
The phased build order, bug register,
and per-section specs live in `docs/implementation-plan.md` — read that for WHAT to build;
read this for HOW it must look.

Identity in one line: **warm, editorial, residential** — cream pages, white hairline cards,
Fraunces serif headlines at weight 400, navy pill buttons, almost no shadows.
Never dark-product/dashboard styling on public pages. Never Shopify Polaris.

## Tokens

```css
@theme {
  /* color */
  --color-ink:       #16191A;   /* text base; body = ink at 55/65/80% alpha */
  --color-paper:     #FAFAF8;   /* light section bg */
  --color-cream:     #F4F2EC;   /* warm alternating section bg */
  --color-sky-100:  #E4F6FD;   /* pills, chips, soft badges */
  --color-sky-300:  #9FE1F8;   /* italic emphasis on dark surfaces */
  --color-sky:      #35C5F0;   /* cyan accent (logo sparkle): dots, small icons */
  --color-eco:      #2D9B6F;   /* ONLY eco-product chips */
  --color-navy:     #1F3A66;   /* primary buttons, highlight pill */
  --color-navy-600: #24477F;   /* hover step */
  --color-navy-700: #16294B;   /* deep accents */
  --color-navy-900: #0F1E38;   /* featured card bg, CTA band, hero scrim */
  --color-gold:      #E8A33D;   /* review stars only */
  --color-line:      rgb(22 25 26 / 0.08);  /* all hairline borders */

  /* type */
  --font-display: "Fraunces Variable", Georgia, serif;
  --font-sans: "Plus Jakarta Sans Variable", system-ui, sans-serif;
}
```

**Tailwind v4 syntax law:** every `--color-*` / `--text-*` / `--font-*` key in `@theme` auto-generates
its utility — write `bg-paper`, `text-navy`, `border-line`, `bg-navy-900`, `font-display`,
`text-display`. The v3 arbitrary-var form `bg-[--color-paper]` is **silently dead in v4** (renders
nothing) — never write it. For a raw var you must use parens: `bg-(--some-var)`.

- Section backgrounds alternate paper → cream. Cards are `#FFFFFF` with `1px solid --color-line`.
- Shadows: default none; hover max `0 8px 24px rgb(22 25 26 / 0.06)` with `-translate-y-0.5`.
- Radii: buttons/pills/chips `9999px`; cards `20px` (16–22 acceptable); CTA band `28px`.

## Typography

| Role | Font | Size | Weight | Notes |
|---|---|---|---|---|
| h1 hero | Fraunces | clamp(2.75rem, 6vw, 5.5rem) | **400** | line-height 1.02, white on photo |
| h2 section | Fraunces | clamp(2.25rem, 4.2vw, 3.75rem) | **400** | line-height 1.05 |
| h3 card | Fraunces | 1.5rem (featured up to 2.25rem) | **400** | |
| Body | Plus Jakarta Sans | 16–18px / 1.6 | 400 | color: ink 65% |
| Small/meta | Plus Jakarta Sans | 13–14px | 400–500 | ink 55% |
| Eyebrow | Plus Jakarta Sans | 14px | 600 | UPPERCASE, tracking 0.08em, navy |
| Nav links | Plus Jakarta Sans | 14px | 500 | |

Hard rules:
- Headings are **never bold** and **never the sans font**. Bold Manrope/Jakarta headings = brand broken.
- Every section h2 highlights its last 2–4 words: `…your home{" "}<span class="text-navy">needs.</span>`
  The explicit `{" "}` before the span is mandatory — rendered text must read as a correct sentence
  (regression: "serviceyou", "homeneeds").
- Hero/CTA-band emphasis on dark: `<em>` italic Fraunces in sky-300.
- Letter-spacing 0 everywhere except uppercase eyebrows.

## Components

**Buttons** — always pills (`rounded-full`), h-12 (44px acceptable), px-6, 15–16px/600.
- Primary: `bg-navy text-white hover:bg-navy-700`.
- Secondary (light bg): `bg-white text-ink border border-line hover:border-ink/25`.
- Ghost on dark: `bg-white/10 text-white border border-white/25 backdrop-blur`.
- Focus: `outline-2 outline-offset-2 outline-sky` on everything interactive.

**Pills & chips** — sky-100 bg, navy text, 13–14px, h-8/9; optional 6px sky leading dot
(`Most popular`, `MOST BOOKED`, tag rows, `Bonded & Insured` badge). Never green (except --color-eco chips), never gray.

**Cards** — white, rounded-[20px], hairline border, p-6/7; icon = lucide 20px, navy stroke,
inside a 40px sky-100 rounded-xl tile. Featured pricing card inverts: navy-900 bg, white text,
sky-300 checks, white pill CTA, floating `Most popular` pill at -top-4.

**Header** — fixed 72px; transparent with white links over the hero, `bg-white/90 backdrop-blur
border-b border-line` once scrolled (>24px) or off-home. Serif wordmark. <1024px:
hamburger → full-height Sheet with Fraunces links; nav must never wrap to a second row.

**Hero** — full-bleed photo `min-h-[92svh]`, navy-900 scrim gradients so white copy is readable at
every width (390px included), bottom fade into paper, trust bar row with white/15 dividers.

**Forms** (booking/contact) — shadcn/ui components from `src/components/ui/` only (Input, Select,
RadioGroup, Checkbox, Calendar, Textarea). Visible labels, h-11 controls, white bg, hairline
borders, navy focus ring. Selected choice-cards: `border-navy bg-[#F0F7FD]`.
Dates: convert with local-time helpers, never `Date.toISOString()`.

**Icons** — lucide-react only. No emoji in UI, no Polaris icons.

## Layout

- Container `min(1200px, 100% - 48px)`, centered. Sections `py-20 lg:py-28`.
- Anchored sections need `scroll-margin-top: 88px` (fixed header).
- Grids collapse to one column ≤768px; bento/pricing follow specs in the plan doc.
- Never render dev/debug state in public UI (API fallback chips, "Shopify flow" badges, step counters).

## QA checklist (run before claiming any UI task done)

1. `npm run typecheck:web && npm run build` pass.
2. Rendered screenshots at 320 / 390 / 768 / 1024 / 1440 px.
3. No horizontal scroll; no clipped, overlapping, run-in, or unreadable text (white-on-light = instant fail).
4. Headings render in Fraunces 400 with correctly spaced emphasis spans.
5. Buttons are pills; palette matches tokens (no greens outside eco chips, no off-palette colors, no 8px-radius buttons).
6. Header usable at every width; mobile menu opens/closes; anchors scroll to the right section.
7. Console free of errors; `/api/site` failure falls back silently to bundled content.

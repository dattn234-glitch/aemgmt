---
name: okay-framer-ui
description: Apply the AE Blue cleaning platform design system for any UI, frontend, website, app screen, component, styling, polish, responsive QA, or visual redesign task in `/Users/datnt1/Desktop/okay`. Use when the user asks to create new UI, improve UI, fix UI bugs, build frontend components, or continue the approved blue Luce-inspired implementation plan.
---

# AE Blue Cleaning UI (project design skill)

## Purpose

AE is a **residential cleaning** brand: subscriptions, move-in/out and post-renovation
cleans, plus a simple online booking flow where AE confirms the visit first and the
invoice/QR appears only after service completion. The target look is **light, clear, trustworthy** —
Luce-inspired booking rhythm, Claude-inspired comparison tables, neutral light surfaces,
Astryx neutral typography (Figtree across display/headings/body), soft blue pill buttons,
gold status highlights, and white token-border cards.

**This replaces all earlier dark, green-primary, or marketplace-admin design directions. Public
screens are light, blue-led, residential, and conversion-focused.**

## Required workflow

1. Read `docs/implementation-plan.md` (repo root) — phases, per-section specs, bug register.
   Work the lowest unfinished phase unless the user asks for something specific.
2. Read `references/design-system.md` (next to this file) — tokens, type rules, component law.
3. Orient in the live code before editing: `src/App.tsx`, `src/components/`, `src/styles.css`,
   `src/lib/site-content.ts`. Reuse existing patterns; keep diffs scoped to the phase.
4. Design system: **Tailwind CSS v4 + shadcn/ui** (components live in `src/components/ui/`).
   Interactive form controls come from shadcn (Radix); marketing sections are composed with
   Tailwind utilities + tokens. Do not add other UI libraries.
5. Verify the rendered UI, not just the code: dev server + screenshots at 320/390/768/1024/1440.
   `npm run typecheck:web && npm run build` must pass.
6. Before finishing: report changed files, checks run, viewports checked, and remaining gaps
   against the phase's QA gate.

## Non-negotiable design rules

- Typography: Astryx neutral/Figtree for display, headings, body, and nav. Section h2 ends with a navy
  emphasis span preceded by an explicit `{" "}` space (rendered text must be a correct sentence).
- Buttons and chips are full pills (`rounded-full`); primary uses soft blue tokens,
  highlights/status use gold tokens.
- Surfaces: neutral light sections, white cards with blue-tinted border tokens, radius 20px, shadows ~none.
- Hero copy is white over a navy scrim — it must stay readable at 390px (white-on-cream = bug).
- Text may never run-in, overlap, clip, or overflow at any width from 320 to 1440.
- No dev/debug state in public UI (API status chips, framework badges, fake controls).
- Icons: lucide-react only.
- Booking/contact keep their existing API contracts (`POST /api/bookings`, `POST /api/contact`,
  `GET /api/site` with bundled fallback).
- Booking payment lifecycle is fixed: `request -> AE confirms visit -> service completed ->
  invoice with QR -> paid`. Never say QR/payment appears immediately after admin confirms.

## Reference files

- `docs/implementation-plan.md`: phases 0–4, IA, bug register B1–B17, per-section implementation
  details, QA gates. **The build order lives there.**
- `references/design-system.md`: tokens, typography table, component specs, QA checklist.

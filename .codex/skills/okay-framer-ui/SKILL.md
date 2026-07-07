---
name: okay-framer-ui
description: Apply the ZestClean design system for any UI, frontend, website, app screen, component, styling, polish, responsive QA, or visual redesign task in `/Users/datnt1/Desktop/okay`. Use when the user asks to create new UI, improve UI, fix UI bugs, build frontend components, or continue the phased implementation plan.
---

# ZestClean UI (project design skill)

## Purpose

ZestClean is a **residential cleaning** brand: subscriptions, move-in/out and post-renovation
cleans, plus a simple online booking flow. The target look is **light, warm, editorial** —
modeled on https://www.zestcleaningco.com/ — cream/paper surfaces, Fraunces serif headlines
(weight 400), Plus Jakarta Sans body, green pill buttons, white hairline-border cards.

**This replaces the earlier "dark Framer product surface" direction — that guidance is dead.
Never build dark dashboard-style UI for public screens, and never use Shopify Polaris.**

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

- Headings: Fraunces, weight 400, never bold, never sans. Section h2 ends with a green
  emphasis span preceded by an explicit `{" "}` space (rendered text must be a correct sentence).
- Buttons and chips are full pills (`rounded-full`); primary green `#2D9B6F`, hover `#1C6549`.
- Surfaces: paper `#FAFAF8` / cream `#F4F2EC` sections, white cards with `1px rgb(22 25 26/.08)`
  borders, radius 20px, shadows ~none.
- Hero copy is white over a forest scrim — it must stay readable at 390px (white-on-cream = bug).
- Text may never run-in, overlap, clip, or overflow at any width from 320 to 1440.
- No dev/debug state in public UI (API status chips, framework badges, fake controls).
- Icons: lucide-react only.
- Booking/contact keep their existing API contracts (`POST /api/bookings`, `POST /api/contact`,
  `GET /api/site` with bundled fallback).

## Reference files

- `docs/implementation-plan.md`: phases 0–4, IA, bug register B1–B17, per-section implementation
  details, QA gates. **The build order lives there.**
- `references/design-system.md`: tokens, typography table, component specs, QA checklist.

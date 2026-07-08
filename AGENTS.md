# Project Codex Instructions

## What this project is

AE Management Services Pte Ltd (Singapore) — residential cleaning subscriptions, move-in/out and post-renovation cleans, with a
simple online booking system. React 19 + Vite (`src/`), NestJS API (`apps/api/`, `/api` prefix).

## Frontend design system

For any UI, frontend, website, app screen, component, styling, responsive QA, or visual redesign
task in this project, read these BEFORE editing UI, in this order:

1. `docs/implementation-plan.md` — phased build order (P0–P7; Part 2 = AE rebrand, DB, QA sweep), information architecture,
   bug register, per-section implementation details, and QA gates. Work the lowest unfinished
   phase unless asked otherwise.
2. `/Users/datnt1/Desktop/okay/.codex/skills/okay-framer-ui/SKILL.md` — project UI skill.
3. `/Users/datnt1/Desktop/okay/.codex/skills/okay-framer-ui/references/design-system.md` — tokens
   and component law.

Direction summary (details in the files above):

- **Light editorial residential brand**: layout language from zestcleaningco.com, SG market patterns from luce.sg, and color primitives from Atlassian design tokens. Public surfaces use neutral light backgrounds, white cards, visible token borders, yellow highlights, and blue brand CTAs.
- **Astryx neutral typography**: Figtree for display, headings, and body text, using the
  Astryx font-family stack and type tokens in `src/styles.css`. Do not reintroduce
  old serif/sans stacks.
- **Pill buttons and chips**: Atlassian brand blue for primary actions, Atlassian yellow for highlights/status, `rounded-full` for CTAs and chips. lucide-react icons only. WhatsApp-first contact (SG).
- **Tailwind CSS v4 + shadcn/ui** (`src/components/ui/`). No Shopify Polaris, no other UI libs.
- The old "dark Framer product surface" direction is retired — never apply it to public screens.

## Workflow

Direct, lightweight implementation (this project opts out of the global `loop-engineering`
model): read the relevant files first, keep diffs scoped to the current phase, run
`npm run typecheck:web` and `npm run build`, and do rendered visual QA (320/390/768/1024/1440 px
screenshots) before claiming UI work complete. Booking/contact/site-content API contracts must
not change during UI phases.

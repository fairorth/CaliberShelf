# Handoff: CaliberShelf v2 — Design & UI Remediation

**For:** Claude Code, working in `c:\Projects\CaliberShelf` (repo `fairorth/CaliberShelf`, branch `master`)
**From:** a design/UI review of the app at commit `5b9687c`, Aug 2026
**Goal:** implement 26 reviewed findings as a v2 design pass, in three ordered phases.
**Mode:** unattended. Every open question has been decided — see `DECISIONS.md`. Do not
stop to ask for approval; implement, verify, and report at the end of each phase.

---

## Read these in order

| File | What it is |
|---|---|
| `DECISIONS.md` | **the decisions already made.** No task in this bundle requires user input. Read first. |
| `00-design-system.md` | tokens, accent rule, type scale, radii, icon policy — **implement first** |
| `01-phase-1-now.md` | 5 defect fixes, no restructuring (C1, F1, B4, B2, D2) |
| `02-phase-2-next.md` | the structural pass (19 findings) |
| `03-phase-3-photo-lab.md` | the photography surface that does not exist yet (D1, D3) |
| `04-screen-specs.md` | **built visual specs** for the three new screens + the design-system reference sheet |
| `screens/CaliberShelf v2 Screens.dc.html` | the mockups themselves — open in a browser |
| `CaliberShelf Design Review.dc.html` | the full narrative review — reasoning, not code |
| `PROMPT.md` | the prompt that kicks this off |

## Overview

This is **not** a new-feature handoff. It is a **remediation spec**: a critique of the
existing CaliberShelf UI, converted into ordered, acceptance-tested tasks against the
real files in this repo.

Four parts:

1. **Write the design system down** (`00-design-system.md`) — tokens, type scale, radii,
   and a single-accent decision. This lands first; every later phase depends on it, and it
   is what stops the drift the review found.
2. **Fix the defects** (`01-phase-1-now.md`) — data-loss guard, zoom lock, contrast and
   discoverability. Small, high value, no restructuring.
3. **Restructure** (`02-phase-2-next.md`) — the watch view page, nav rail, accent
   enforcement, type scale, collection toolbar.
4. **Build the Photo Lab** (`03-phase-3-photo-lab.md`) — the photography surface that
   exists only as scripts and docs today.

Findings are referenced by ID (`A1`, `B4`, `E1`…). `04-screen-specs.md` carries the visual
specification for the three screens the review deliberately did not over-specify.

## About the design files in this bundle

- **`screens/CaliberShelf v2 Screens.dc.html`** — high-fidelity mockups of the watch view
  page, the navigation rail (three breakpoints) and the Photo Lab (Coverage + Review),
  built to the design system in `00-design-system.md`. These are **design references in
  HTML**, not production code: recreate them in this repo's own environment (Next.js App
  Router + Tailwind v4 + shadcn/ui, Server Components, Server Actions, `cn()`, kebab-case
  files, named exports). Do not copy the HTML, do not add a new UI library, do not
  introduce CSS-in-JS. `support.js` must sit beside the file for it to render.
- **`CaliberShelf Design Review.dc.html`** — the review document. Reference only; its
  styling is document styling, not app styling.

## Fidelity

**High-fidelity for the three new screens** (`04-screen-specs.md` + the mockups): exact
colors, type sizes, spacing and states are given — match them, using shadcn primitives
and the repo's tokens rather than reproducing literal values.

**Specification-level for everything else**: exact values where the review prescribes one
(hex codes, type scale, radii, contrast floors, viewport config); otherwise the task
states the intent and the constraint, and you choose the implementation within the
existing design language.

## How to run this — unattended

- **Task zero, before Phase 1:** copy `00-design-system.md` into the repo as
  `docs/design-system.md`, and paste its final "Rules block for root `CLAUDE.md`" section
  into the root `CLAUDE.md` under a new `## Design System` heading. Commit that alone.
  Nothing else in this bundle gets copied into the repo.
- **One phase per branch, one finding per commit.** `v2/phase-1`, `v2/phase-2`,
  `v2/phase-3`. Findings are independent by design; don't batch them into mega-commits.
  Merge each phase to `master` when its exit checklist passes.
- **Order within Phase 2 matters** — follow the commit order stated at the top of
  `02-phase-2-next.md`. The design-system sweeps (E1–E5) come before the new screens
  (A1, A2), or the new screens get built twice.
- **Phase 3 comes last** and depends on Phase 2's watch view page (A1), nav rail (A2) and
  shared upload component (A3).
- **Bump `package.json` "version"` on every commit** — the repo already requires this, and
  the version badge is the only signal of what's deployed.
- **Run the gates after every finding:** `npm run lint`, `npm run typecheck`,
  `npm run build`, plus `.claude/skills/verify` where it applies. Do not proceed past a
  red gate; fix forward.
- **After A1 and A2, re-check every internal link.**
  `grep -rn "watch/.*\/edit" src/` finds the ones that assume the form is the destination.
- **Migrations** follow `supabase/CLAUDE.md` and `.claude/skills/db-migration`; regenerate
  database types afterwards and keep RLS consistent with the existing ownership pattern.
- **Report, don't ask.** At the end of each phase, write a short summary: findings landed,
  files touched, migrations added, anything you deliberately deviated from and why. If a
  task genuinely cannot be implemented as written, implement the closest thing that
  satisfies its acceptance criteria and note it in that summary — do not stall.

## Finding index

| ID | Severity | Finding | Phase |
|---|---|---|---|
| A1 | Critical | Edit is the only watch page | 2 |
| A2 | High | A hamburger at every breakpoint | 2 |
| A3 | High | Four upload paths, three interaction models | 2 |
| A4 | Medium | "Gallery" names three different things | 2 |
| A5 | Low | Reports index has a dead card | 2 |
| B1 | High | Nine controls in one wrapping row | 2 |
| B2 | Critical | Filters persist invisibly | 1 |
| B3 | High | Two sort systems | 2 |
| B4 | High | Zebra striping in the accent hue | 1 |
| B5 | Medium | Identical-looking cells, three destinations | 2 |
| B6 | Medium | Tiles crop the subject | 2 |
| C1 | Critical | Unsaved work escapes every exit but one | 1 |
| C2 | High | The form is dark-only | 2 |
| C3 | Medium | Three-column field grid, no rhythm | 2 |
| D1 | Critical | No Photo Lab in the app | 3 |
| D2 | High | The photo panel fights the photographer | 1 |
| D3 | High | Quick Capture has the flow inverted | 3 |
| D4 | Medium | The hero is a screensaver you can't operate | 2 |
| E1 | Critical | Brass broke its own rule | 2 |
| E2 | High | Emoji as the icon system | 2 |
| E3 | High | No type scale; page titles disagree | 2 |
| E4 | Medium | Six radii, none from the token scale | 2 |
| E5 | Low | Muted text does 80% of the talking | 2 |
| F1 | High | Pinch-zoom disabled on the phone | 1 |
| F2 | Medium | Missing ARIA semantics | 2 |
| F3 | Low | Two buttons and a paragraph explaining them | 2 |

## Definition of done for v2

- `docs/design-system.md` exists and the rules block is in root `CLAUDE.md`.
- No hex or `white/[0.0x]` literals for surface, border, field or text colors in
  `src/components/` or `src/app/(dashboard)/` — tokens only. (The `watch-hero` /
  `display-box` / `watch-dial` material gradients are the documented exception.)
- **Light mode is fully supported and verified on every screen** (see `DECISIONS.md`).
- No emoji in navigation, card headers, buttons or empty states (except ✨ and ⚠).
- Exactly one accent drives interactive elements, app-wide.
- Every font size comes from the six-step scale; every page `h1` is the same size.
- `/watch/[id]` renders a view page; `/watch/[id]/edit` is reached deliberately.
- Photo Lab is a nav destination with Coverage, Session and Review.
- `npm run lint && npm run typecheck && npm run build` clean.

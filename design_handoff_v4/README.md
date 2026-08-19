# TenTenLoupe — design handoff v4

One phase so far. v4 exists because v3's phases (6 and 7) are **built and
shipped**; this folder holds the work that follows from living with them.

| Doc | Phase | State |
|---|---|---|
| `11-phase-8-home-second-pass.md` | Home second pass: single-spine layout, film strip, aspect-fit frame box, Boxes in the nav, display case restyle, header clock | specced, not started |
| `12-phase-9-watch-pages.md` | Watch view & edit pages: corrections, coherence with the new home page, and retirement of the dial-framing editor | specced, not started |
| `13-phase-8-dimensions.md` | Phase 8 step 0: stored photo dimensions — the one migration across both phases, and what NULL means | agreed, built first |

`SHOOTING-NOTES.md` is **not** an implementation doc — it is photography guidance
for the first EOS Utility session, written because the home stage's geometry
makes a frame's shape matter as much as its content. Nothing in it is for Claude
Code.

Numbering continues unbroken across all four folders (v2 ended at 07, v3 holds
08–09, `10-capture-data` is referenced from `light-table.tsx`), so the phase
history reads as one sequence regardless of which folder a doc sits in.

## Mock

`screens/TenTenLoupe Home - Redesign.dc.html` — the build target, and the
binding visual spec for layout, hierarchy and label wording. Open it in a
browser with `support.js` beside it. Three sections:

- `3a` the reorganized home page — the header clock is live and ticking
- `3b` the Boxes nav flyout
- `3c` the restyled display case
- `4a` forced 3:2 vs aspect-fit, using a real portrait frame
- `5a` composition guides for a flat shot on a 3:2 stage (see `SHOOTING-NOTES.md`)

Sections are ordered newest-first, so turn 5 appears at the top.

Drawn with the user's own photographs (`w-*.png`, cropped from production
screenshots) so the bloom, the strip and the case are judged against real
material rather than placeholder tone.

## Required reading outside this folder

Phase 8 **amends** the two phases that preceded it, by section reference — it is
not self-contained. Read these first and do not delete either folder:

**`design_handoff_v3/`**
- `08-phase-6-home-light-table.md` — the Light Table itself. Phase 8 removes the
  60-watch rotation cap from its §1 and replaces the contact-sheet grid from
  its §2.5. **Phase 9 §1 reverses its §3 disposition of the framing editor** —
  that doc says keep it retitled; Phase 9 retires it.
- `09-phase-7-light-table-flair.md` — the bloom and glance mode. Phase 8
  replaces the fixed `rgba(0,0,0,0.52)` scrim in its §1.1 with a
  luminance-derived one, and keeps everything else in it binding (bloom from
  `thumbUrl`, no `will-change`, single-interval rule, reduced-motion behaviour).

**`design_handoff_v2_design_remediation/`** — still authoritative, still
referenced:
- `DECISIONS.md` — locked decisions (light mode only, manual save)
- `00-design-system.md` — colour roles, the six-step type scale, three radii.
  **Phase 8 §8 withdraws its display-box materials exception** — that edit lands
  in the same commit as the restyle.
- `04-screen-specs.md` — the shell: nav rail, header, touch targets
- `brand/BRAND.md` + mark and lockup assets
- `FIXES-ROUND-*.md` — compliance sweeps a new screen must not regress

## Convention

Every phase doc ends with an exit checklist, and every spec grounds its values in
real repo files rather than restating them from memory.

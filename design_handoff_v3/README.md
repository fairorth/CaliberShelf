# TenTenLoupe — design handoff v3

Starts where v2 finished. v2 was a remediation pass on an existing app (26
findings, three phases, plus the rebrand and three rounds of fixes). v3 is new
capability.

## Phases in this folder

| Doc | Phase | State |
|---|---|---|
| `08-phase-6-home-light-table.md` | Home page: the Light Table, replacing the Living Dial | specced, not started |

Mocks live in `screens/`. They are Design Components — open the `.dc.html`
directly in a browser, with `support.js` sitting beside it:

- `TenTenLoupe Home - Light Table.dc.html` — the build target. Interactive:
  hover a thumbnail, hover the big frame for the loupe, open the ROTATION menu.
- `TenTenLoupe Home Concepts.dc.html` — the three directions the Light Table was
  chosen from (1a Gallery Print, 1b Light Table, 1c Editorial Spread). Kept for
  the record; 1a and 1c are still live options for other surfaces.

## What still lives in v2, and stays authoritative

`design_handoff_v2_design_remediation/` is not superseded. v3 specs reference it
and it should not be deleted or renamed:

- `DECISIONS.md` — the locked decisions (light mode only, manual save, etc.)
- `00-design-system.md` — the design system: colour roles, the six-step type
  scale, three radii, motion rules
- `brand/BRAND.md` + the mark and lockup assets
- `04-screen-specs.md` — the shell (nav rail, header, touch targets)
- `FIXES-ROUND-*.md` — the compliance sweeps a new screen must not regress
- `07-phase-5-sales-investment.md` — Phase 5 (Watches as Investments), mid-build
  at the time v3 opened. It stays in v2 because it is already referenced there
  and partly implemented; move it here only if you would rather group by version
  than by continuity.

## Conventions carried forward

Numbering continues the v2 sequence (v2 ended at 07), so there is one unbroken
phase history across both folders. Each phase doc ends with an exit checklist,
and every spec grounds its values in real repo files rather than restating them
from memory.

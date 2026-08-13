# Fix pass — v2 review round 1

Run this BEFORE the rename pass. Branch `fix/v2-review-1` off the current tip of main.
Commit per numbered item. Do not merge; stop and report.

Reference: `01-...`–`03-...` phase docs and `04-screen-specs.md` in this folder are still the
source of truth for intent. Where this document and a phase doc disagree, this document wins —
it is written against what actually shipped.

---

## 1. The app is stuck in dark mode — highest priority

Light mode is the locked decision (see `DECISIONS.md`). The running app renders dark on every
screen and Settings exposes no theme control.

Find what is forcing it. Likely candidates: a literal `class="dark"` on `<html>` in
`app/layout.tsx`, a `defaultTheme="dark"` or `forcedTheme` on the theme provider, a
`prefers-color-scheme` media block that has no light branch, or `:root` tokens in `globals.css`
that were tokenized to dark values during C2.

Required end state:

- Light is the default on a fresh profile with no stored preference.
- Every surface, border, text and brass token resolves correctly in light mode — this is what
  C2 was supposed to deliver, so re-verify C2's tokenization rather than assuming it is done.
- Do **not** add a theme switcher. Light only. If a dark palette exists, leave the tokens in
  place but unreachable.

Verify by loading every screen — collection table, collection tiles, watch view, watch edit,
Photo Lab (all three tabs), Settings — in a clean profile and confirming no dark surfaces and no
unreadable text.

## 2. Filter dialog uses system blue — one-accent violation

The filter dialog renders native checkboxes with the browser's blue accent, native `<select>`
elements with blue focus rings, and a blue **Done** button. E1 locked brass as the only accent.

- Replace the native checkboxes with the design-system checkbox, brass when checked.
- Replace the native `<select>`s with the design-system select. If none exists, style the native
  element: token background, token border, brass focus ring — never the UA default.
- **Done** becomes the brass primary button. **Clear all** stays a quiet text button.
- Sweep the rest of the app for the same problem: `grep -rn "accent-blue\|blue-[45]00\|#3b82f6"`
  and any unstyled native `input[type=checkbox]`, `input[type=radio]` or `select`.

## 3. Collection toolbar — B1 did not land correctly

What shipped is a single band (search, Filters, Table/Tiles) with a **Columns** button orphaned
on its own line below, right-aligned against empty space. That is worse than the pre-v2 state.

Rebuild per `04-screen-specs.md`:

- **Band 1** — search field (flex-grow), then Filters, then the Table/Tiles segmented control.
- **Band 2** — active-filter chips on the left, and the view-specific controls on the right:
  Columns in table view, nothing in tiles view.
- When there are no active filters and the view has no controls, band 2 does not render at all.
  No empty band, no floating button.

## 4. Table is clipped at the viewport edge

"WORN" is cut off and the header cost figure is sliced mid-digit. An eight-column default must
fit a 1440px viewport without horizontal scroll.

- Audit the column widths. Photo and category are over-wide; ref/box/worn are starved.
- The metrics in the page header (`SHOWING`, `COST`) must never be clipped — they are currently
  running under the viewport edge.
- Below 1200px, drop to the six-column set rather than introducing horizontal scroll.
- Horizontal scroll is acceptable only when the user has explicitly added columns beyond the
  default set.

## 5. Zebra striping is not visible (B4)

Either it did not land or the alternate row value is too close to the base surface to read. In
light mode the alternate row should be a perceptible but quiet step off the base surface. Verify
on screen, not in the token file.

## 6. Filter dialog has no hierarchy

Eleven control groups stack at equal visual weight with no grouping and no scroll affordance —
the dialog runs past the fold with nothing indicating more content below.

- Group into three sections with headings: **Status** (Owned / Coming Soon / Wish List and the
  wish-list source), **Attributes** (Category, Complication, Labels, Brand, Movement, Movement
  Type, Case Material, Box), **Price** (Price Tracking, Price Tiers).
- The footer (match count, Clear all, Done) pins to the bottom of the dialog; the body scrolls
  under it.
- Keep the live match count. It is the best thing in the current dialog.

## 7. Photo Lab — implementer note is rendering as UI copy

The Session tab shows: "Pick the session watch. One watch, many frames — the folder-per-watch
routing is the CaliberShelf linkage." That is a note written to you, not label copy.

Replace with: **"Choose the watch for this session. Every frame you shoot files to it
automatically."**

Then sweep all three Photo Lab tabs — and the rest of the app — for any other spec language that
was pasted into the UI. Words like "linkage", "routing", "coverage matrix" and "the spec" do not
belong on screen.

## 8. Confirm the in-header filter glyphs are intentional

The table's Category and Brand cells show a small funnel glyph beside certain values (Horology,
Xeric). If that is a per-value quick-filter affordance, it needs a tooltip and a keyboard path.
If it is leftover debug or an accidental render, remove it.

---

## Exit checks

- Fresh profile loads light on every screen; no dark surface anywhere
- `grep -rn "blue-[45]00\|#3b82f6\|accent-blue"` returns nothing in app code
- No unstyled native checkbox, radio or select remains
- Collection table fits 1440px with the default eight columns, nothing clipped
- Band 2 of the toolbar is absent when empty, never a floating button
- No spec vocabulary in any user-visible string
- lint, typecheck, build pass

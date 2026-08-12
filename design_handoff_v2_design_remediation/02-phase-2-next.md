# 02 — Phase 2: the structural pass

Nineteen findings. This is where v2 actually becomes v2. Order matters: the design-system
sweeps (E1–E5) touch nearly every file, so do them **before** A1/A2 build new screens —
otherwise the new screens get built twice.

**Suggested commit order:** E1 → E3 → E4 → E2 → E5 → C2 → A4 → A5 → F3 → F2 → B1 → B3 →
B5 → B6 → C3 → D4 → A1 → A2 → A3.

---

# Design-system sweeps

## E1 — Enforce one accent  ·  CRITICAL
Implement §1 of `00-design-system.md` in full. Mechanical but wide.
**Touches:** `globals.css` (token comments, delete `--sidebar-*`), `watch-form.tsx`
(`CARD`, `CARD_HEADER`, `CHIP`, brass Save, brass asterisks), `add-watch-flow.tsx`
(brass CTA, eyebrow, dropzone, asterisks), `nav-header.tsx` (pills → brass),
`home-stage.tsx` (toggle), `collection-table.tsx` + `gallery-grid.tsx` +
`collection-view.tsx` (prices → mono foreground), `collection-table.tsx`
(`ResizeHandle` hover).
**Acceptance:** one accent drives every interactive element; no colored card borders or
header washes; no colored prices; `globals.css` comments match reality.

## E3 — Type scale  ·  HIGH
Implement §2. Add the six vars, then replace every `text-[Npx]` (grep finds them).
Normalise every page `h1` to 26px `font-display font-semibold tracking-tight` — currently
Collection/Config/Reports are `text-lg`, watch edit is `text-2xl`, Add is 34px. Move
Fraunces out of table cells (`collection-table.tsx` brand cell, 15.5px) and gallery tiles.
**Acceptance:** no arbitrary size literals remain; all page titles identical; no serif
below 19px.

## E4 — Three radii  ·  MEDIUM
Implement §3. Grep `rounded-[`. Leave the physical-object components alone
(`watch-hero.tsx`, `display-box-home.tsx`, `watch-dial.tsx`).

## E2 — lucide everywhere  ·  HIGH
Implement §6. Replace nav emoji, card-title emoji, subsection eyebrows, `⌚` empty
states, `📷` shutter, `✅` success, and the `▣`/`◷`/`$$` markers. Keep `✨` and `⚠`.
Add `aria-hidden` to all of them.
**Note:** `$$` and `◷` currently carry meaning only in a `title` attribute — invisible on
touch. Replace with icon + a visible legend row under the table (F2 depends on this).

## E5 — Text hierarchy  ·  LOW
Implement §5. Grep `muted-foreground/` to find the stacked-opacity cases. Pick the one
primary value per surface.

## C2 — Light mode is supported; tokenise everything  ·  HIGH
Implement §4. Light mode is **kept** (`DECISIONS.md` §1). Tokenise every literal (`FIELD`,
`[color-scheme:dark]`, `bg-white/[0.0x]`, tile gradients, zebra), keep the toggle and
`next-themes`, and verify all screens in both themes.

---

# Naming, dead ends, copy

## A4 — Fix the "Gallery" collision  ·  MEDIUM
- `/dashboard` is labelled "Home" in nav but its metadata title is `"Gallery | …"` — fix
  the title to `Home`.
- Rename `/gallery` (inspiration images) to `/inspiration`, with the nav label
  "Inspiration". Add a redirect from `/gallery`.
- Collection's tile view: rename the toggle label "Gallery" → "Tiles".
- Consolidate the two add routes: `/add` (the quick-add flow) and `/collection/new`.
  Keep `/add`; redirect `/collection/new` to it.
**Acceptance:** one referent per word; browser tab titles correct on every route.

## A5 — Reports index  ·  LOW
Make the unbuilt Wear Summary card non-interactive (render as a `div`, not a `Link`,
with the existing "Coming soon" pill and reduced opacity). Rank the grid instead of
nine equal cards: Collection Summary + Attention Needed first (daily), then Collection
Map / By Category / By Box / Brand Wish List / Valuations, then Agent Execution Review.
Put a live value on the cards that have one — Attention Needed: open-item count;
Agent Execution Review: last run date + spend this month; Valuations: last run date.
**Acceptance:** no card leads to a placeholder; the daily reports are visually first.

## F3 — Add-flow CTAs  ·  LOW
Replace `Save & add details →` / `Save & close` + the explanatory paragraph with one
primary **Save watch** (lands on the new watch view page from A1) plus a quiet
**Save and add another** for batch entry. Delete the paragraph.
**Acceptance:** no prose is needed to explain the buttons.

## F2 — ARIA sweep  ·  MEDIUM
- `aria-sort="ascending|descending|none"` on `SortableHeader`'s `<th>`
  (`collection-table.tsx`).
- `aria-expanded` + `aria-controls` on the nav menu button (`nav-header.tsx`).
- `aria-hidden` on every decorative glyph (done as part of E2).
- Column resize handles: add keyboard support (`role="separator"` already present; add
  `tabIndex={0}` and arrow-key width adjustment) or accept pointer-only and document it.
- Replace `title`-only meaning (`$$`, `◷`, `▣`) with icon + visible legend.
**Acceptance:** table sort state is announced; the menu button state is announced; no
meaning exists only in a `title`.

---

# Collection page

## B1 — Two-band toolbar  ·  HIGH
**File:** `collection-view.tsx`

Split the single `flex-wrap` row (nine controls) into two bands:

- **Band 1 — identity + stats:** `Collection` (26px title) and a stat strip of labelled
  mono numbers: `SHOWING 12/34` · `COST $48,200` · `VALUE $52,100` · `+8.1%`. Labels in
  11px uppercase mono muted, values in 13px mono foreground (delta in
  `--chart-2`/`--destructive`). This replaces the single run-on status string that mixes
  four facts.
- **Band 2 — controls:** search (flex-grow), Filters button (with active count badge),
  sort control, view switcher pinned right.
- Move the tile-size slider into the tile view's own top-right corner, or replace it with
  three fixed densities (S / M / L) — a continuous 120–400px slider is more control than
  the job needs.
- Delete the hand-rolled `SELECT_CLASS` native `<select>`; use the shadcn `Select` for
  sort so all dropdowns match.
- The category `Select` is removed here (it becomes a chip per B2, Phase 1).

**Acceptance:** the toolbar does not reflow unpredictably at laptop widths; totals are
labelled; no native select sits beside a shadcn one.

## B3 — One sort owner  ·  HIGH
**Files:** `collection-view.tsx`, `collection-table.tsx`

Today the toolbar dropdown and the table headers sort independently, reconciled by
deleting `TABLE_SORT_KEY` on dropdown change — so the dropdown can read "Sort: Brand"
while the table is sorted by price.

Lift sort into a single state object in `collection-view` (`{key, dir}`), passed to
`CollectionTable` as props with an `onSortChange` callback. In **table view** the headers
are the only control (remove the dropdown). In **tile view** the dropdown is the only
control. One `localStorage` key. Switching views preserves order where the key applies.
**Acceptance:** no combination of clicks produces disagreeing sort indicators.

## B5 — One row, one destination  ·  MEDIUM
**File:** `collection-table.tsx`

Today Category → filtered URL, Brand → filter callback, Model/Nickname/Photo → edit page,
all styled as underline-on-hover text, and no whole-row target.

- Make the **whole row** the link to the watch (the new view page from A1).
- Move "show all of this brand/category" to a small lucide `Filter` glyph revealed on
  cell hover (or a right-click context menu), with a consistent affordance on both cells.
- Make the visible column set choosable (a `Columns` dropdown persisting to
  localStorage), defaulting to eight of the eleven — Photo, Brand, Model, Category,
  Ref #, Movement Type, Box, Worn — with Nickname, Caliber and Price opt-in.
**Acceptance:** clicking any part of a row opens the watch; filtering by brand/category
is discoverable and visually distinct from navigation.

## B6 — Tiles stop cropping  ·  MEDIUM
**File:** `gallery-grid.tsx`

- Tiles become **4:5 portrait**, and the photo starts at the tile's top edge — remove the
  28px header strip that currently sits above every image.
- Frame the cover using the stored `dial_focal_x` / `dial_focal_y` / `dial_zoom` (as
  `watch-hero.tsx` already does) instead of a bare centred `object-cover`.
- Move the movement-type chip into the metadata footer beside the caliber; badges
  (coming-soon / wishlist / guide / price-check / wear count) overlay the photo's top-right
  on hover, or sit in the footer — not in a permanent strip that outweighs the watch.
**Acceptance:** no lugs or straps cut off in tiles; the photo is the largest and topmost
element of every tile.

---

# Watch form & hero

## C3 — Field rhythm  ·  MEDIUM
**File:** `watch-form.tsx`

- Size fields to content instead of a uniform 3-column grid: Brand/Model/Nickname
  normal width; Serial and Notes full width; mm/g/m values in a compact numeric block.
- Group the nine case measurements into a labelled **2×4 spec block** with right-aligned
  mono values and the unit rendered as a suffix inside the field (`42.0 mm`), not in the
  label. This is the highest-density part of the form and it should read like a spec
  sheet, which is the app's whole visual thesis.
- Replace the three status checkboxes (`is_coming_soon`, `is_wishlist`, plus the gated
  `price_check_enabled`) with: one **Status** segmented control — Owned / Coming soon /
  Wish list (decided, `DECISIONS.md` §6) — since the app's own filter logic already treats
  them as mutually exclusive
  (`matchesStatus`: wish-list beats coming-soon beats owned); and keep price-check as a
  single checkbox with its "requires a reference number" helper.
  **This changes the data written** — `is_coming_soon`/`is_wishlist` stay as columns; the
  control just guarantees they're never both true. Validate in the Zod schema.
**Acceptance:** the Specifications card reads as a spec sheet; status is one control;
no field is wider than its content needs.

## D4 — Make the hero operable  ·  MEDIUM
**Files:** `watch-hero.tsx`, `home-stage.tsx`, `globals.css`

- Hover pauses the auto-advance; `←`/`→` step manually; clicking the dial navigates to
  the watch (the view page from A1).
- Extend `@media (prefers-reduced-motion: reduce)` to stop the swap interval, the
  `cshero-ring` sweep, and `csfade` — today only `.dial-sunburst` is handled.
- Give the hero one line of context it doesn't have: days since last worn, latest
  valuation delta, or "no hero-angle photo yet" (which makes the stage feed the Photo Lab).
- Make the Living Dial / Display Box toggle state legible at a glance (per E1 it becomes
  brass-active).
**Acceptance:** the hero can be paused and stepped; reduced-motion freezes it entirely.

---

# Structure — do these last, one at a time

## A1 — Restore the watch view page  ·  CRITICAL
**Files:** new `src/app/(dashboard)/watch/[id]/page.tsx` (currently a redirect to
`/edit`), plus link updates across `collection-table.tsx`, `gallery-grid.tsx`,
`watch-hero.tsx`, `quick-capture.tsx`, `add-watch-flow.tsx`, report pages.

**Build to the mockup — `04-screen-specs.md` §1 is authoritative.** Summary of the shape:

- **Left / main:** the cover photo large and **`object-contain`** on a neutral field,
  with the other frames as a filmstrip below; click opens the lightbox (D2).
- **Right / rail:** brand + model + nickname (26px display), reference in mono,
  a **spec sheet** as label/value mono rows (case, movement, dimensions,
  complications, water resistance), then Ownership (purchase date, price, box, status).
- **Strips below:** Wear (count, last worn, "Wear today" button — the existing
  `WearTodayButton`), Valuation (latest estimate + sparkline, read-only, linking to the
  report), Timegrapher (last run summary, link to add a run), Straps.
- **One `Edit` affordance** top-right. Delete lives on the edit page only.
- Keep `/watch/[id]/edit` as-is (with Phase-1 C1 fixes and Phase-2 C3 fixes).

Then repoint **every** internal link from `/watch/[id]/edit` to `/watch/[id]`, except
deliberate "fix this" links from the Attention Needed report and Config, which should
keep going straight to the form with their `?from=` return targets intact.
`grep -rn "watch/\${.*}/edit\|watch/.*\/edit" src/` finds them all.

**Acceptance:** every browse path lands on a read-only page; no accidental-edit risk from
casual browsing; the `?from=` return-target behaviour still works for the fix-it links.

## A2 — Navigation rail  ·  HIGH
**Files:** `src/components/layout/nav-header.tsx` (split), `(dashboard)/layout.tsx`

**Build to the mockup — `04-screen-specs.md` §2 is authoritative.** Target:

- **≥lg:** a persistent ~200px left rail with the four existing groups given *visible*
  headings — Collection (Collection, Brands, Straps) · Analysis (Wear Log, Reports,
  Guides) · Acquisition & Imagery (Deals, Photo Lab, Inspiration, Batch Import) ·
  System (Config, About). Current item marked with brass (E1). Home sits above the groups.
- **md:** the same rail, icon-only (48px), tooltips on hover.
- **≤sm:** the current drawer, but as an **overlay** — today it expands the header and
  pushes the page down.
- **Delete the centered Home/Collection segmented control** — those are just the first
  two rail items.
- The header keeps: logo + version, global search, Add Watch, theme toggle (if C2 keeps
  it), account/sign-out.
- `aria-current="page"` on the active item; `aria-expanded` on the mobile trigger (F2).

**Acceptance:** on a desktop, every destination is visible without opening a menu; the
group semantics are readable; no layout jump when navigating.

## A3 — One upload component  ·  HIGH
**Files:** new `src/components/photo-drop.tsx`; consumers `add-watch-flow.tsx`,
`watch/[id]/_components/photo-uploader.tsx`, `capture/_components/quick-capture.tsx`,
`batch-import/_components/batch-import-form.tsx`

Today there are four upload paths with three interaction models, and **only** the add
flow downscales client-side (`downscaleImage`, 2000px long edge, JPEG 0.85) — so the
other paths are the ones that hit "photo may be too large".

Extract one component providing: drag-and-drop, click-to-browse, paste-from-clipboard,
camera capture on touch devices, `downscaleImage` on every path, multi-file support,
per-file progress, and error toasts. Then delete the three bespoke implementations.
Also: `/capture` is **promoted**, not deleted (`DECISIONS.md` §5) — it becomes the Photo
Lab's session capture entry point in Phase 3 (D3) and appears in the nav under Photo Lab.

**Acceptance:** one component, four call sites; every path downscales; no orphaned route.

---

## Phase 2 exit checklist

- [ ] `docs/design-system.md` in the repo; rules block in `CLAUDE.md`
- [ ] No `text-[Npx]`, no `rounded-[Npx]` (outside the illustration components)
- [ ] No emoji outside ✨ and ⚠; no hex/`white/[0.0x]` surface literals
- [ ] One accent; prices are neutral mono
- [ ] `/watch/[id]` is a view page; all browse links point at it
- [ ] Desktop nav rail with named groups; segmented control gone
- [ ] One upload component, four call sites
- [ ] `npm run lint && npm run typecheck && npm run build` clean

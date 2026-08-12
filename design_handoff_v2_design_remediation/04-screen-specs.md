# 04 — Screen specs

Authoritative for the three new screens. Mockups: `screens/CaliberShelf v2 Screens.dc.html`
(open in a browser; `support.js` must sit beside it). Build to these; no proposal step
(`DECISIONS.md` §4).

**How to read the values.** The mockups are static HTML, so they carry literal hex codes.
**Do not copy the literals.** Every one maps to an existing token — the table below is the
mapping. Implement with tokens and shadcn primitives so light mode works for free.

| Mockup literal | Token | Role |
|---|---|---|
| `#0f1318` | `--background` | page |
| `#0c1015` | `--background` at -2% L (add a `--surface-rail` token) | nav rail |
| `#161b21` | `--card` | cards, panels, matrix body |
| `#0b0e12` | one step below `--background` (add `--surface-photo`) | photo fields |
| `#1e242c` / `#2a323b` | `--muted` / `--secondary` | neutral chips |
| `#eef1f5` | `--foreground` | primary text |
| `#8c95a0` | `--muted-foreground` | secondary text |
| `#6c757f` | `--muted-foreground` at 13px+ | mono eyebrows, meta |
| `#c9a25e` | `--brass` | **all** action, active, selection |
| `#6ea2dd` | `--primary` | data-only chips, info |
| `#5aa37a` / `#8fd0ac` | `--chart-2` | scored/positive |
| `#e0a184` / `#e8877c` | `--chart-4` / `--destructive` | warn / bad coverage |
| `rgba(255,255,255,0.08)` borders | `--border` | hairlines |

Type in the mockups is the six-step scale exactly: 11 / 13 / 15 / 19 / 26 / 38.
Radii are 8px (controls, small tiles), 14px (cards, photo frames), `9999px` (pills).
Icons are lucide at 16px, `stroke-width: 1.75`.

---

## 1. Watch view page — `/watch/[id]` (finding A1)

**Purpose:** present a watch. Read-only. The place you land from every browse path.

### Layout
- App shell: 200px rail · 1fr content. Header 56px, `border-bottom: --border`.
- Content padding: 22px top, 26px sides, 30px bottom; vertical rhythm 20px between blocks.
- Back link row: `chevron-left` + "Collection", 13px `--muted-foreground`.
- Title row: title block left, actions right, `align-items: flex-start`, gap 24px.
- Body: `grid-template-columns: 1fr 380px`, gap 22px, `align-items: start`.
- Below body: three equal strips, `grid-template-columns: repeat(3,1fr)`, gap 14px.

### Title block
- `h1` 26px Fraunces 600, `tracking-tight`. Brand at `--foreground`; model/nickname in the
  same line at `--muted-foreground` weight 400 (`Grand Seiko SBGA413 "Shunbun"`).
- Meta row, gap 12px: reference in 13px mono `--muted-foreground`; a 1px×12px divider;
  then pills at 11px mono, `letter-spacing: 0.1em`, padding 3px 9px, radius pill:
  - status (`OWNED` / `COMING SOON` / `WISH LIST`) — `--muted` background, neutral text
  - box (`BOX 2`) — `--primary` @14% background, `--primary` text
  - `PRICE TRACKED`, only when enabled — same data-blue treatment
- **No brass in the meta row.** Status is data, not action.

### Actions
- `Wear today` — outline, 36px tall, 8px radius, 13px medium, `watch` icon. Uses the
  existing `WearTodayButton` behaviour (and its "already worn today" state).
- `Edit` — **brass fill** `#c9a25e` / text `#1a1206`, 36px, 13px 600, `pencil` icon.
  Links to `/watch/[id]/edit`. This is the only primary action on the page.
- Delete does **not** appear here — it lives on the edit page only.

### Photo column
- Cover frame: `aspect-ratio: 4/3`, radius 14px, 1px `--border`, background
  `--surface-photo`, image `object-contain` centred. **Never crop.**
- Overlay top-left: `COVER · HERO` pill, 11px mono, brass @16% bg, brass text — the angle
  tag comes from `watch_photos.angle`; omit the angle half when untagged.
- Overlay top-right: 30px square, radius 8px, `rgba(0,0,0,0.45)`, `maximize-2` — opens the
  lightbox. Clicking the frame itself opens it too (finding D2).
- Filmstrip: `grid-template-columns: repeat(6,1fr)`, gap 8px, square tiles, radius 8px.
  Cover tile has a **2px brass border**; others 1px `--border`. Each tile shows its angle
  tag bottom-left in 11px mono. Last cell is a dashed `+ ADD` tile opening the shared
  uploader (A3). Tiles are `object-cover` (dense grid) — acceptable here.
- Filmstrip is drag-reorderable (`sort_order`), and a tile's context menu offers
  set-cover / delete / retag.

### Spec rail (380px)
Two cards, gap 14px, radius 14px, `--card`, 1px `--border`.

- Card header: 14px 16px padding, `border-bottom: --border`, 16px lucide icon in
  `--muted-foreground` + 19px Fraunces 600 title. **No colored left border, no header
  wash** (finding E1). Titles: `Specifications` (`settings-2`), `Ownership` (`receipt`).
- Rows: `display:flex; justify-content:space-between; align-items:baseline;` padding 9px 0,
  `border-bottom: --border @60%`, last row no border. Label 13px `--muted-foreground`;
  value 13px mono `--foreground`.
- Specifications rows, in order: Movement (`manufacturer caliber_name · caliber_type`),
  Case material, Crystal, Dial. Then a **2-column sub-grid** (gap 0 18px) for the six
  measurements — Diameter, Height, Lug-to-lug, Lug width, Weight, Water res. — values
  `tabular-nums` with the **unit in the value** (`40.2 mm`), never in the label.
  Then a Complications row: label left, chips right (11px mono, `--muted` pill).
- Omit any row whose value is null. Do not render "—" placeholders on this page.
- Ownership rows: Purchased (ISO date, mono), Paid (mono `tabular-nums`, **`--foreground`,
  not brass**), Stored in (`Box 2 · <description from Config → Boxes>`).
- Serial number is **not** shown on the view page (it's private and belongs in the form).

### Strips
Each: radius 14px, `--card`, 1px `--border`, padding 16px 18px, gap 12px column.
- Eyebrow 11px mono `letter-spacing: 0.14em` `--muted-foreground` + a right-aligned
  `chevron-right` (whole strip is a link).
- Big value 26px mono `tabular-nums`, with its unit/delta beside it at 13px.
- One 13px context line, `--muted-foreground`, with the key term at `--foreground`.
- The three: **WEAR** (count · "Last worn <date> · N days ago" → `/wear-log`),
  **MARKET VALUE** (latest mid · delta in `--chart-2`/`--destructive` · "run date ·
  confidence" → the valuations report), **TIMEGRAPHER** (last rate s/day · "date · lift
  angle N°" → the timegrapher panel on the edit page).
- Add a fourth **STRAPS** strip when the watch has strap assignments; otherwise omit.
- Each strip renders an empty state rather than disappearing when the data is missing
  (e.g. "No valuations yet · enable price checking").

### States
- No photos → the cover frame becomes a dashed `--border` drop target with
  `CaliberShelfMark` at 32px and "Drop the first frame" (no ⌚ emoji).
- Wish-list watch → status pill reads `WISH LIST`; Ownership's "Paid" label becomes
  "Est. cost"; Wear strip is omitted.
- Hover on filmstrip tiles: 1px → brass border, 150ms.

---

## 2. Navigation rail (finding A2)

Three breakpoints, all mocked.

### ≥lg — 200px expanded
- Background `--surface-rail`, `border-right: --border`, padding 14px 12px, column gap 18px
  between groups.
- Brand block: **the existing `CaliberShelfMark` component** (`src/components/calibershelf-mark.tsx`
  — the two-gear brass mark on navy, vector twin of `public/icons/*`) at `size={26}` with
  `rounded-[8px]`, unchanged; then `CaliberShelf` 19px Fraunces 600 and `v{APP_VERSION}`
  11px mono `--muted-foreground` on the line below. **Do not redraw or replace the mark** —
  the mockup shows `icon-192x192.png` only because it is static HTML.
- Group heading: 11px mono, `letter-spacing: 0.14em`, `--muted-foreground`, padding
  `0 10px 6px`. Headings are **visible text**, not separator lines.
- Items: `flex` gap 10px, padding 8px 10px, radius 8px, 15px label, 16px lucide icon.
  - idle: `--muted-foreground`
  - hover: `background: white/5`, text `--foreground`, 150ms
  - **active: `background: --brass @14%`, text `--brass`, weight 500**, `aria-current="page"`
- Order and grouping (exactly): `Home` (ungrouped, above the first heading) ·
  **COLLECTION** — Collection `list`, Brands `tag`, Straps `link-2` ·
  **ANALYSIS** — Wear Log `calendar-days`, Reports `chart-column`, Guides `compass` ·
  **ACQUISITION & IMAGERY** — Deals `badge-dollar-sign`, Photo Lab `camera`,
  Inspiration `images`, Batch Import `package-plus` · **SYSTEM** — Config `settings`,
  About `info`.
- Photo Lab's Capture sub-entry is reached inside Photo Lab, not as a rail item.

### md — 56px icon-only
- 36px square items, radius 8px, centred 16px icons, same active/hover treatment.
- `CaliberShelfMark` at `size={32}` at the top (the real component, per ≥lg above).
- 24px×1px `--border` divider between groups instead of a text heading.
- Tooltip (shadcn `Tooltip`) on hover carrying the label.
- Config pinned to the bottom (`margin-top: auto`).

### ≤sm — overlay drawer
- 264px panel, `--surface-rail`, `border-right: --border`,
  `box-shadow: 14px 0 40px rgba(0,0,0,0.5)`, over a `rgba(7,9,12,0.66)` scrim.
- **Overlays the page — never pushes layout** (the current header-expanding menu is the bug).
- Trigger becomes `x` while open; `aria-expanded` + `aria-controls` (finding F2).
- Items 10px padding (44px minimum touch target).
- Escape and scrim click close it; focus is trapped while open.

### Header (all breakpoints)
56px, `border-bottom: --border`: search box (34px, radius 8px, 1px `--border`,
`search` icon + 13px placeholder, 280px on desktop) · right group — `Add Watch` brass
button (34px, `plus` icon, label hidden below sm) · theme toggle (34px square, outline) ·
account avatar (34px circle, `--muted`). **The centered Home/Collection segmented control
is deleted.**

---

## 3. Photo Lab — Coverage — `/photo-lab` (finding D1)

**Purpose:** answer "what do I shoot tonight" in one glance.

### Header
- `h1` 26px Fraunces 600 `Photo Lab`.
- Summary line, 15px: `18 of 34 watches have a hero angle · 6 have no photo at all ·
  41 frames awaiting review`, with the counts that need attention at `--foreground`.
- Actions: `Reshoot list` outline with a mono count · `Start session` **brass** with
  `camera`.

### Tabs
Underline tabs, 15px, 9px 14px padding, active = 2px brass bottom border + `--foreground`.
`Coverage` · `Session` · `Review` (Review carries a data-blue count pill).

### Filter row
34px outline controls, 13px: `Sort: worst coverage first` · `Box: all` ·
`Never shot only` (toggle, `filter` icon). Right-aligned legend, 11px mono
`letter-spacing: 0.08em`: 11px swatches — `--chart-2` SCORED · `--secondary`
FRAMES, UNSCORED · dashed `--border` EMPTY.

### The matrix
- Container: radius 14px, `--card`, 1px `--border`, rows separated by `--border @60%`.
- Grid: `300px repeat(5,1fr) 120px`. Header row 44px, 11px mono
  `letter-spacing: 0.1em` `--muted-foreground`, angle columns centred, `COVERAGE`
  right-aligned. Columns are the five angle classes from `docs/photo-lab.md`:
  **FLAT DIAL-ON · HERO ¾ · PROFILE · CASEBACK · MACRO**.
- Body rows 64px. Watch cell: 40px cover thumb (radius 8px) + brand 15px medium + model
  13px `--muted-foreground`. No cover → `--muted` tile with `image-off` at
  `--muted-foreground @70%`.
- Cell states:
  - **scored** — pill, 26px tall, padding 0 10px, radius pill, `--chart-2 @18%` bg,
    `#8fd0ac` text, 11px mono: `<grade> · <count>` (`A− · 6`)
  - **frames, unscored** — same pill in `--secondary` / `--muted-foreground`, count only
  - **empty** — 26px circle, 1px dashed `--border`, `plus` icon `--muted-foreground`
  - **empty AND on the reshoot list** — same circle with a **dashed brass border and brass
    icon**. Brass here means "this is the action", consistent with §1 of the design system.
- Coverage column: `n/5` in 13px mono `tabular-nums`; `--chart-4` at 1–2, `--destructive`
  at 0, `--foreground` above.
- Row hover: `background: white/2`, 150ms.
- **Cell click → Session for that watch, pre-set to that angle. Row click → the watch view
  page.** Keyboard: rows are focusable, arrow keys move within the grid.
- Empty state (no watches with photos yet): the matrix still renders with all cells empty —
  it is a to-do list, not a report.

---

## 4. Photo Lab — Review — `/photo-lab/review` (finding D1)

**Purpose:** judge scored frames at size, fast, keyboard-first.

### Top bar
- Run selector (34px outline, 13px): `Run: photo-score · Aug 11, 20:14`.
- Position: `FRAME 7 / 42` in 13px mono, current index at `--foreground`.
- Progress bar: 3px, radius pill, `--muted` track, **brass** fill, max-width 280px.
- Right: `42 FRAMES · 38 SCORED · $0.06` in 11px mono (cost in `--chart-2`), and a
  `keyboard` + `SHORTCUTS` affordance. Cost formatting matches the Agent Execution Review
  report — reuse that component if practical.

### Body — `grid-template-columns: 1fr 360px`, gap 18px
**Frame:** `aspect-ratio: 3/2`, radius 14px, `--surface-photo`, `object-contain`.
- Top-left pills, 11px mono: class — `STACKED COMPOSITE · 30 SRC` or `SINGLE · f/8` in
  `--primary @16%` — then the angle tag in `rgba(0,0,0,0.5)`.
- Bottom-right: `Z · 100% at dial ROI` control (30px, radius 8px, `zoom-in`). Zoom crops to
  the exact ROI the scorer measured.
- Below: a strip of the frame's **duplicate cluster** — 76×56 tiles, radius 8px, current
  one with a 2px brass border, discarded siblings at 45% opacity, plus
  `DUP CLUSTER · 2 OF 4 KEPT` in 11px mono.

**Side panel** — three cards + an action stack, gap 14px:

1. **SCORE** card: eyebrow 11px mono; grade at 26px Fraunces 600 in `--chart-2` (or
   `--chart-4`/`--destructive` below B). Three metrics — Dial-ROI sharpness, Highlight
   control, Framing margin — each a label/value row (13px, value mono `tabular-nums`)
   over a 3px bar (`--muted` track; `--chart-2` ≥0.7, `--brass` 0.5–0.7,
   `--destructive` <0.5). Then the model's reasoning as 13px prose, then
   `HAIKU SHOT-CARD · $0.0015` in 11px mono.
2. **ANGLE · 1–5** card: five pills, 11px mono. Selected = **brass fill**, `#1a1206` text.
   Number keys set the tag.
3. **Actions:** `Accept` (brass fill, 40px, 15px 600, `check`, shortcut `A` shown at 75%
   opacity) beside `Reject` (outline, `x`, `R`); then full-width
   `Accept & set as cover` (outline, `star`, `C`). Below: `← → NAVIGATE · Z ZOOM ·
   ESC EXIT` in 11px mono, space-between.
4. **Note** panel: `--primary @7%` bg, 1px `--primary @20%`, radius 14px, `info` icon +
   13px text: *"Singles are sharp only at the focal plane — never graded against
   composites."* This is a real constraint from `docs/photo-lab.md`, not decoration —
   keep it visible.

### Behaviour
- Accepting uploads the frame into `watch_photos` (thumbnail generated, angle tag applied,
  optionally set as cover) and advances to the next frame in one action.
- Review state persists (`review_state` + `reviewed_at`) so a session is resumable.
- Rejecting never deletes the source file on disk — it only marks the row.
- The whole flow must be completable from the keyboard without a mouse.

---

## 5. Photo Lab — Session (not mocked)

Build in the same shell (header + tabs) and idiom. Per `03-phase-3-photo-lab.md`:
watch picker → the watch's target angles with coverage state · the **copyable capture
folder path** (`profiles.watch_images_path` + `<Brand> <Model> [<8-char-id>]`) as the
prominent element, since it is what gets pasted into EOS Utility · the C1 pre-flight
checklist, collapsible, read-only, rendered from `docs/photo-lab.md` · frames landed so far
with scores · the shared uploader in multi-frame mode for phone captures. Persist the
active session watch so Capture (D3) inherits it.

Use the §1 spec-rail row pattern for the checklist and the §3 pill vocabulary for angle
coverage. Do not invent a third visual language.

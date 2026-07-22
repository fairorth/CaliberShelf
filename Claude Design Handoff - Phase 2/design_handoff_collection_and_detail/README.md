# Handoff: CaliberShelf — Watch Detail (final), Edit page & Add flow (desktop)

## What this package is
A visual/UX redesign of CaliberShelf delivered as **HTML/CSS design references** (interactive prototypes). **They are not production code to copy.** Recreate the designs inside the existing codebase (Next.js App Router + React + Tailwind + shadcn/ui + Supabase) using its established components, tokens, and patterns. Where this doc names a real file (e.g. `watch-specs.tsx`), implement the design by editing that component.

**Files in this bundle**
- `CaliberShelf Redesign.dc.html` — the main interactive prototype. Contains **Home dial**, **Collection** (gallery + table), **Watch Detail**, **Edit**, and **Add** (desktop) behind a Home/Collection nav + click-through. Open it and click around: a watch card → Detail; Detail → **Edit**; header **＋ Add** → the desktop **Add** screen.
- `CaliberShelf Add Watch.dc.html` — a *secondary* mobile (iPhone-framed) reference for Add. **Not the primary target** — see the Add section. Included only as a reference for a future mobile add.
- `ios-frame.jsx` — device-frame helper used by the mobile reference file only.

> The watch faces in the prototype are CSS/SVG **placeholders** standing in for real watch photography (`cover_photo_url` from Supabase). Don't ship them.

---

## ⭐ What's new in THIS update (where to focus)
The Home dial and Collection (gallery + table) were delivered and implemented previously and are **unchanged** here. This update is three surfaces:

### 1. Watch Detail — completed to the full target  → `watch-specs.tsx`, `watch-detail-header.tsx`
Previously the Detail mockup was slimmer than the real app. It now matches the full target:
- **Specifications card** gains the missing rows: **Strap Width**, **Lug-to-Lug**, **Case Height**, **Dial Color** (with a small color swatch), and a **Complications** subsection (wrap of outline badges from the comma-separated `complication` field).
- **New third card — Category & Labels**: a category badge (uses the category's own color) + the watch's label pills (existing `labelColorMap`).
- **Accent is now brass `--primary` everywhere** — the prototype's old steel-blue (`#6ea2dd`) is fully retired. Use brass for the interactive accent (Wore Today, icon chips, hover rings, active states) and price.
- **Left brass spine on every card** (`border-l-2 border-l-primary/40`) — already present in `watch-specs.tsx`; apply to all three Detail cards.
- **Empty fields render muted "Not set"** (dimmed italic), not "+ Add" — Detail is read-only; editing lives on `/watch/[id]/edit`.

### 2. Edit page — designed in full  → `watch/[id]/edit/page.tsx`, `watch-form.tsx`, `dial-framing-editor.tsx`
The field set and structure already match the real `watch-form.tsx` (it was the source of truth). The design specifics to implement:
- **Two-column layout:** sticky left = cover photo (Cover badge / expand / **Delete photo**) + **Upload Photo** + the **Dial Framing editor**; right = the same three cards as Detail, but **editable**.
- **Card chrome matches Detail:** brass left spine, `bg-primary/5` header, brass icon chip, serif title.
- **Inputs:** dark filled boxes (`#1b212a`, 1px hairline, radius 9px) with a **brass focus ring**. Selects shown as the existing shadcn `Select`.
- **★ NEW UX — sticky dirty-state save bar.** Replace the current plain bottom button with a **fixed bottom bar**: a status chip on the left (`● Unsaved changes` in brass ↔ `All changes saved` muted, driven by form dirty state) and **Cancel** + **Save Changes** (brass, disabled/dimmed until dirty) on the right. This is the main new interaction on Edit.
- Keep the existing **Brand**/**Movement** comboboxes (search + create-new), **Movement preview** block, **complication checkboxes** (`KNOWN_COMPLICATIONS` + free "Other" input), and **label toggle pills**.
- **Dial Framing editor** already exists — keep it; just align its styling (round preview ring in brass, brass "Save framing").

### 3. Add — REDESIGNED for desktop  → `add-watch-flow.tsx`, `add/page.tsx`
**This is a deliberate change from the current implementation.** The current Add is mobile camera-first (`capture="environment"`), which only helps on a phone. The user adds & edits **on desktop** (iPhone → iCloud → workstation → upload); the phone is for viewing the collection. Redesign Add as a **desktop, upload-first** screen:
- **Drop the camera-first step on desktop.** Lead with a **drag-and-drop / Browse** photo zone (optional), with a filled state once a file is attached (thumbnail, filename, size, "will be set as cover", **Remove**). (You may keep a camera affordance behind a mobile/`@media`/touch check, but it must not be the desktop default.)
- **Still minimal — three fields:** Brand* (combobox w/ create-new), Model*, Category*. Full specs/photos/framing intentionally stay on Edit.
- **★ Two CTAs (the smart part the user loved):**
  - **Save & add details →** — create the watch, then **redirect to `/watch/[id]/edit`** (the full form). This is the quick-add → refine path.
  - **Save & close** — create the watch, then **redirect to `/watch/[id]`** (or back to the collection).
  - Both call the existing `createWatchWithPhoto` server action; only the post-create redirect differs.
- The header **＋ Add** opens this desktop screen (in the prototype it's an in-app view; in the app it's the `/add` route).
- `CaliberShelf Add Watch.dc.html` (the iPhone version) is **reference only** for a possible future mobile add — not part of this implementation.

---

## Alignment with the existing codebase (READ FIRST)
1. **Accent = brass `--primary`, not steel-blue.** The prototype's blue is fully retired this update; map every interactive accent to the app's existing brass `--primary`. Price stays brass/gold. Do **not** introduce a new blue token.
2. **Left-border accent card pattern is intentional** — already in `watch-specs.tsx` (`border-l-2 border-l-primary/40`). Apply across Detail + Edit cards.
3. **Empty fields → muted "Not set"** on the read-only Detail. Editing is on `/watch/[id]/edit`. Not an inline "+ Add".
4. **Labels & categories are user-defined** with named colors via `labelColorMap` (`@/lib/validations/label`); category has its own `color`. The prototype's "AliExpress / Quartz / GMT" and category colors are just *this user's* data — render whatever the watch actually has.
5. **Gallery price is gated** behind Config → Settings `showCost` (`SHOW_COST_KEY`). Use `formatCurrency(purchase_price_cents, purchase_currency)` + `tabular-nums`. (Collection is unchanged this update, but keep honoring it.)
6. **Detail header subtitle = `nickname || model`** (nickname *replaces* model). Worn line: `Worn {n} time(s) · Last: {Mon D}` from `wearInfo`.

### Component / file map
| Design surface | Implement in |
|---|---|
| Detail header (title, actions, labels) | `src/app/(dashboard)/watch/[id]/_components/watch-detail-header.tsx` |
| Detail spec cards (Specifications + Category & Labels) | `src/app/(dashboard)/watch/[id]/_components/watch-specs.tsx` |
| Detail page shell + photo | `src/app/(dashboard)/watch/[id]/page.tsx`, `_components/photo-gallery.tsx` |
| Edit page shell (2-col, sticky photo + framing) | `src/app/(dashboard)/watch/[id]/edit/page.tsx` |
| Edit form (3 cards, inputs, **+ new sticky save bar**) | `src/components/watch-form.tsx` |
| Dial framing editor | `src/app/(dashboard)/watch/[id]/edit/_components/dial-framing-editor.tsx` |
| **Add flow (desktop redesign)** | `src/app/(dashboard)/add/_components/add-watch-flow.tsx`, `add/page.tsx` |
| Collection (unchanged) | `collection/_components/collection-view.tsx`, `gallery-grid.tsx`, `src/components/collection-table.tsx` |

### Data model (from `supabase/migrations`)
`watches`: `brand` (rel `.name`), `model`, `reference_number`, `serial_number`, `nickname`, `movement` (rel: `manufacturer`, `caliber_name`, `caliber_type`), `case_material` (enum), `case_diameter_mm`, `crystal` (enum), `strap_width_mm`, `lug_to_lug_mm`, `case_height_mm`, `water_resistance_m`, `dial_color`, `complication` (comma-separated), `condition`, `purchase_date`, `purchase_price_cents`, `purchase_currency`, `notes`, `is_coming_soon`, `category_id`. Labels via `watch_labels`. Enum display via `caseMaterialLabels`/`crystalLabels` (`@/lib/validations/watch`), `caliberTypeLabels` (`@/lib/validations/movement`), `KNOWN_COMPLICATIONS` (`@/lib/validations/watch`).

---

## Detailed spec — Watch Detail
**Layout:** max-width ~1180px. Back link "‹ Return to Collection". Title row: left = identity, right = actions. Below, a 2-column grid (`430px 1fr`, gap 26px): left = photo + upload; right = stacked spec cards.

- **Title block:** serif brand 38px; subtitle = `nickname || model` serif 21px `#aab3bd`; row of label pills; `Coming Soon` badge inline with brand when `is_coming_soon`.
- **Actions (top-right):** `◷ Wore Today` (brass outline → `quickWear`), `Edit` (outline → `/watch/[id]/edit`), `Delete` (destructive → confirm → `deleteWatch`). Below: `Worn {n} time(s) · Last: {Mon D}`.
- **Photo (left):** square framed image, **Cover** badge (brass) top-left; below it a dashed **⬆ Upload Photo** button.
- **Card style:** surface `#161b21`, 1px hairline, radius 16px, **left brass spine** `border-l-2 border-l-primary/40`; header = brass icon chip (`bg-primary/15`) + serif 19px title.
- **Card 1 — Identity & Ownership** (🏷️): Brand, Model, Nickname (italic), Reference Number (mono), Serial Number (mono), Purchase Date (long), Purchase Price (mono, brass), Notes. Empty → muted **"Not set"**.
- **Card 2 — Specifications** (⚙️):
  - **Movement** subsection — `MovementPreview`: caliber name + type pill (brass for mechanical) + Manufacturer / Beat Rate / Power Reserve.
  - **Case** subsection rows — Case Material, Crystal, Case Diameter (mono), **Strap Width** (mono), **Lug-to-Lug** (mono), **Case Height** (mono), Water Resistance (mono), **Dial Color** (name + a small color swatch dot).
  - **Complications** subsection — wrap of outline badges from the comma-separated `complication` field; empty → "Not set".
  - Section labels: 11px bold uppercase, tracking-widest, `#6b7480`, with a fading hairline.
- **Card 3 — Category & Labels** (📂): Category row (badge using the category's color + a dot) + Labels (wrap of colored pills via `labelColorMap`). Empty → "Not set".

## Detailed spec — Edit
**Layout:** max-width ~1180px. Header: "‹ Back" + "Edit {brand} {model}". 2-column grid (`430px 1fr`, gap 26px).
- **Left (sticky):** cover photo with **Cover** badge + **expand** (⤢) + **Delete photo** overlay; dashed **⬆ Upload Photo**; then the **Dial framing** card — full-image editor with a draggable white crosshair (drag to set focal point), a `focal x%, y%` readout, a live **round preview** (object-position = focal, scale = zoom, brass ring), a **Zoom** slider (1–4×), and **Save framing** / **Reset**. (Matches `dial-framing-editor.tsx` — `dial_focal_x/y`, `dial_zoom`.)
- **Right (form):** the three cards from Detail, **editable**:
  - Card chrome identical to Detail (brass spine, `bg-primary/5` header, brass icon chip).
  - **Identity & Ownership:** Brand* (combobox), Model*, Nickname, Reference Number (mono), Serial Number (mono, full width), Purchase Date (`type=date`, `color-scheme: dark`), Purchase Price ($, mono), **Coming soon** checkbox (brass accent), Notes textarea.
  - **Specifications:** Movement combobox + Movement preview; Case grid (Material/Crystal selects, Diameter/Strap/Lug-to-Lug/Height/Water mono number inputs, Dial Color text); Complications checkboxes (`KNOWN_COMPLICATIONS`) + "Other complications (comma-separated)" input.
  - **Category & Labels:** Category select* + label **toggle pills** (selected = the label's `labelColorMap` color with a check + ring; unselected = muted).
- **Inputs:** `#1b212a` fill, 1px hairline (`rgba(255,255,255,.1)`), radius 9px, padding ~11–13px, text `#e6eaee`; **focus → brass border** (`rgba(201,162,94,.55)`).
- **★ Sticky save bar (NEW):** fixed full-width bottom bar, blurred dark background, top hairline. Left: an 8px dot (brass + glow when dirty, grey when clean) + `Unsaved changes` / `All changes saved`. Right: **Cancel** (ghost) + **Save Changes** (brass; dimmed & non-interactive until dirty). Wire to the form's dirty state.

## Detailed spec — Add (desktop)
**Layout:** centered ~640px column inside the app shell.
- Back **‹ Cancel**; eyebrow `NEW ENTRY` (brass, mono, tracked); serif h1 **"Add a Watch"**; one-line subtitle ("…brand, model, and a category. Photos, specs & dial framing follow on the Edit page.").
- **Card** (brass spine) containing:
  - **Photo — optional:** dashed **drop zone** (icon + "**Browse** or drag a photo here" + "JPG, PNG, HEIC or WebP · up to 25 MB"), hover → brass tint. Filled state: 60px thumbnail + filename + "2.8 MB · will be set as cover" + **Remove**.
  - **Brand\*** combobox (search + "＋ Create new brand"), **Model\*** input, **Category\*** select.
- **Actions:** **Save & add details →** (brass; create → redirect to `/watch/[id]/edit`) and **Save & close** (outline; create → redirect to `/watch/[id]` or collection). Helper line explaining the two.
- **Required validation:** Brand, Model, Category marked with a brass `*`. (Optionally show an inline error on submit if missing — the prototype shows only the asterisks.)

---

## Design Tokens (prototype values — map accent to brand `--primary`/brass)
**Fonts:** display/serif = Newsreader; UI/sans = Hanken Grotesk; mono = JetBrains Mono (in-repo: keep the existing `font-display` + sans + mono stack).
**Color:** bg `#0f1318`; page gradient `#11161c → #0d1116`; elevated surface `#181d24`; card surface `#161b21`; input fill `#1b212a`; hairlines `rgba(255,255,255,.06–.10)`. Text: primary `#eef1f5`; secondary `#aab3bd`/`#8c95a0`; tertiary `#6b7480`; spec value `#e6eaee`; muted "Not set" `#5b6470` italic. **Interactive accent = brass `--primary`** (prototype `#c9a25e`, chip text `#d8b878`). Price/brass `#c9a25e`. Dial navy `#16406b → #081a30`; second hand `#c8402f`. Label pills + category: use existing color maps.
**Radius:** pills/badges 20px; buttons/inputs 8–12px; cards 13–16px; thumbnails 50%.
**Shadows:** card hover `0 16px 30px rgba(0,0,0,.4)`; dropdown `0 18px 38px rgba(0,0,0,.55)`.

## Assets & icons
- Watch imagery: real `cover_photo_url` thumbnails from Supabase. The prototype's CSS/SVG dials are placeholders.
- Icons: lucide already in use (`Table`, `LayoutGrid`, etc.) — keep. Fonts via the existing setup.

## Out of scope this update
Home dial and Collection (gallery + table) are unchanged from the prior delivery — no work needed there. Other surfaces (config, wear-log calendar, reports, batch-import, timegrapher) are not part of this package.

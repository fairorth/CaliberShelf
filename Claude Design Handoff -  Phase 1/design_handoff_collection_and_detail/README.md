# Handoff: CaliberShelf — Home Dial, Collection (Gallery + Table) & Watch Detail Redesign

## Overview
A visual/UX redesign of three CaliberShelf surfaces:
1. **Home dial** — the rotating watch-face landing screen.
2. **Collection** — the main list of all watches, in **Gallery** and **Table** view modes.
3. **Watch Detail** — a single watch's page.

The goal is a more refined, horology-appropriate look: stronger hierarchy, one consistent accent, a deliberate type system, photo-first collection views, and a cleaner empty-field treatment — while preserving the app's existing information architecture and the watch-dial "now showing" delight on the home screen.

## About the Design Files
The file in this bundle (`CaliberShelf Redesign.dc.html`) is a **design reference created in HTML/CSS** — an interactive prototype showing the intended look and behavior. **It is not production code to copy.** The watch faces in it are CSS/SVG *placeholders* standing in for real watch photography.

The task is to **recreate these designs inside the existing CaliberShelf codebase** (Next.js App Router + React + Tailwind + shadcn/ui + Supabase) using its established components, tokens, and patterns — not to ship the HTML. Where this document names a real file (e.g. `watch-specs.tsx`), implement the design by editing that component.

## Fidelity
**High-fidelity.** Colors, typography, spacing, radii, and interactions are intentional and specified below. Recreate pixel-faithfully using the codebase's existing libraries — **but map the prototype's literal accent to the app's real design token** (see "Alignment with the existing codebase").

---

## Alignment with the existing codebase (READ FIRST)
This prototype was built before reading the repo, then reconciled against it. Honor these corrections when implementing:

1. **Accent color = brass/gold (`--primary`), not the prototype's steel-blue.** The app's real system uses brass as primary (`SpecCard` brass spine `border-l-primary/40`, brass icon chips `bg-primary/15`, `font-display` serif). In the prototype, steel-blue (`#6ea2dd`) plays the "interactive accent" role and gold (`#c9a25e`) is used for price. **When implementing, use the app's existing `--primary` (brass) for the interactive accent** (active toggles, the home-dial active ring, focus states) and keep price in the same brass/gold. Do **not** introduce steel-blue as a new token.
2. **The left-border accent card pattern is intentional** — it already exists in `watch-specs.tsx` (`border-l-2 border-l-primary/40`). Keep it.
3. **Empty fields:** the prototype shows a "+ Add" affordance for blank fields. The real specs page is **read-only**; editing happens on `/watch/[id]/edit`. Implement empty fields as a muted **"Not set"** (dimmed), optionally linking to the Edit page — **not** an inline-add control.
4. **Labels & categories are user-defined** with named colors via `labelColorMap` (`@/lib/validations/label`). The prototype's "AliExpress / Quartz / GMT" are just *this user's* labels — render whatever labels the watch actually has, using the existing color map. Same for category (user-defined, has a `color`).
5. **Gallery price is gated** behind the Config → Settings `showCost` toggle (`SHOW_COST_KEY`). Only render price when `showCost` is true. Use `formatCurrency(purchase_price_cents, purchase_currency)` and `tabular-nums`.
6. **Detail header subtitle is `nickname || model`** (nickname *replaces* model when present) — not both. The worn line is `Worn {n} time(s) · Last: {Mon D}` from `wearInfo`.

### Component / file map
| Design surface | Implement in |
|---|---|
| Collection toolbar + view switch | `src/app/(dashboard)/collection/_components/collection-view.tsx` |
| Gallery cards | `src/app/(dashboard)/collection/_components/gallery-grid.tsx` |
| Table rows | `src/components/collection-table.tsx` (not yet imported — request if needed) |
| Filters dialog | `src/app/(dashboard)/collection/_components/collection-filters.tsx` |
| Detail header (title, actions, labels) | `src/app/(dashboard)/watch/[id]/_components/watch-detail-header.tsx` |
| Detail spec cards | `src/app/(dashboard)/watch/[id]/_components/watch-specs.tsx` |
| Detail page shell + photo | `src/app/(dashboard)/watch/[id]/page.tsx`, `_components/photo-gallery.tsx` |
| Home dial | (home/dashboard route) |

### Data model (from `supabase/migrations`)
`watches`: `brand` (rel `.name`), `model`, `reference_number`, `serial_number`, `nickname`, `movement` (rel: `manufacturer`, `caliber_name`, `caliber_type`), `case_material` (enum), `case_diameter_mm`, `crystal` (enum), `strap_width_mm`, `lug_to_lug_mm`, `case_height_mm`, `water_resistance_m`, `dial_color`, `complication` (comma-separated), `condition`, `purchase_date`, `purchase_price_cents`, `purchase_currency`, `notes`, `is_coming_soon`, `category_id`. Labels via `watch_labels` junction. Enum display via `caseMaterialLabels` / `crystalLabels` (`@/lib/validations/watch`), `caliberTypeLabels` (`@/lib/validations/movement`).

---

## Screens / Views

### 1. Home Dial
**Purpose:** Ambient landing screen that showcases the collection as a working watch; the second hand sweeps and highlights one watch at a time ("now showing").

**Layout:** Centered column. A ~560px circular steel **case** containing a ~506px **dial**. Twelve watches sit at the clock-hour positions around a ~196px radius ring. Real-time hour/minute/second hands overlay the dial. Below the dial (with generous clearance), a centered caption block. A small stat line sits below that. Top padding ~78px so the watch clears the nav.

**Components:**
- **Case:** radial steel gradient `radial-gradient(circle at 36% 28%, #f0f2f4, #b4babf 42%, #6a7077 72%, #3f454b)`; outer shadow `0 26px 60px rgba(0,0,0,.55)` + inset highlights.
- **Lugs (×2, top & bottom):** ~278px-wide groups; two ~18px steel prongs at the outer edges with a ~9px **spring bar** spanning between them, plus small end-pin nubs. Prongs extend ~76px to meet the case. Steel gradients `linear-gradient(100deg,#eef1f3,#a4aab0 48%,#5d636b)`.
- **Crown (3 o'clock):** fluted cylinder — `repeating-linear-gradient(90deg,#e6eaed 0 1.6px,#878d94 1.6px 3.2px)` with top highlight / bottom shade insets, plus a small stem.
- **Dial:** navy guilloché `radial-gradient(circle at 50% 42%, #16406b, #081a30 78%)` + sunburst rays via `repeating-conic-gradient(from 0deg, rgba(255,255,255,.05) 0 2deg, transparent 2deg 9deg)` + inner vignette. Subtle "CS / CALIBERSHELF" monogram at ~27% height.
- **Watch thumbnails (×12):** ~74px circles at hour positions. **Active** one scales to ~96px, full opacity, ring + glow `0 0 0 2px <accent>, 0 0 26px 3px <accent>88`. Inactive: 0.8 opacity, subtle shadow. Position `i`: angle `i*30°`, `x = C + R·sin`, `y = C − R·cos` (C≈253, R≈196).
- **Hands:** silver hour/minute batons + thin red second hand (`#c8402f`) with counterweight; SVG rotated by real time (`hourDeg=(h%12)*30+m*.5`, `minDeg=m*6+s*.1`, `secDeg=s*6`). The second hand reaches the thumbnail ring so it visually "points" at the active watch.
- **Caption (below dial, ~112px margin to clear the bottom lug):** mono eyebrow `NOW SHOWING · 07 / 12` in accent; serif brand 34px; italic serif model 20px `#aab3bd`; mono meta `Movement · Caliber` `#7d8893`; an outlined accent **"View watch →"** button (navigates to that watch's detail). Fades in (`@keyframes` opacity+translateY, .5s) on each change.
- **Stat line:** mono, `64 watches | 31 brands | 3 worn this week` (`#6b7480`, numbers brighter).

**Behavior:** A 1s interval ticks the clock. `activeIndex = floor(seconds / 5) % 12` (each watch highlighted for 5s). Active thumbnail enlarges/glows; caption + second-hand target update together.

### 2. Collection — toolbar (shared)
Left→right: serif **"Collection"** title; **category** Select (`All` + user categories); **Filters** button (opens existing `CollectionFiltersDialog`); **Sort** select (`Default / Brand / Price / Purchase date / Case size`) + asc/desc toggle; **"{n} of {total}"** count; pushed right: **Size** slider (gallery mode only, 120–400, step 10) and a **Table / Gallery** segmented toggle (lucide `Table` / `LayoutGrid` icons). Active segment = inverted (`bg-foreground text-background` in the real app; in the prototype the active accent fill). Toolbar is a `flex flex-wrap items-center gap-3`.

### 2a. Collection — Gallery
**Layout:** `grid` with `gridTemplateColumns: repeat(auto-fill, minmax(${size}px, 1fr))`, gap 18px.
**Card:** surface `#181d24`, 1px hairline border, radius 13px, `overflow:hidden`, cursor pointer. **Hover:** `translateY(-4px)`, border → accent, shadow `0 16px 30px rgba(0,0,0,.4)`. Top: square photo area (`aspect-square`, radial backdrop) with the cover image (`object-cover`, hover `scale-105`); a **Coming Soon** badge top-left when `is_coming_soon`. Body (padding ~14px): serif **brand** 16px; **model** 13px `#8c95a0`; divider; then a row with mono **caliber** (`#6b7480`) and mono brass **price** (only if `showCost`). Movement line format: `caliber_name (caliberTypeLabel)`. Clicking the card → `/watch/[id]`.

### 2b. Collection — Table
**Layout:** bordered container (radius 14px), full-width `<table>`, sticky-feel header row (`bg rgba(255,255,255,.02)`, bottom hairline). Columns: **Photo, Category, Brand, Model, Movement, Caliber, Labels, Price**.
- **Header cells:** 11px, 600, uppercase, `letter-spacing .6px`, `#6b7480`; Price right-aligned.
- **Body row:** bottom hairline, cursor pointer, hover `background rgba(255,255,255,.035)`; click → `/watch/[id]`.
- **Cells:** Photo = 38px round thumbnail (cover); Category `#8c95a0` 13.5px; **Brand** serif 15.5px 600 `#eef1f5`; Model `#aab3bd`; Movement `Mechanical · Automatic` / `Quartz` `#8c95a0`; Caliber mono 12px `#7d8893`; Labels = flex-wrap pills (existing `labelColorMap`); Price mono 13.5px brass, right-aligned (respect `showCost`).

### 3. Watch Detail
**Purpose:** View one watch's photo, identity, specs, category & labels; quick actions.

**Layout:** max-width ~1180px. A back link **"‹ Return to Collection"**. A title row: left = identity, right = actions. Below, a 2-column grid (`430px 1fr`, gap 26px): left = photo + upload; right = stacked spec cards.

**Components:**
- **Title block:** serif **brand** 38px; subtitle = **`nickname || model`** serif 21px `#aab3bd`; a row of label pills (existing color map); if a nickname exists, it's the subtitle (don't also show model). Show **Coming Soon** badge inline with brand when `is_coming_soon`.
- **Actions (top-right):** `⌚ Wore Today` (outline, calls `quickWear`), `Edit` (outline → `/watch/[id]/edit`), `Delete` (destructive, opens confirm dialog → `deleteWatch`). Below: `Worn {n} time(s) · Last: {Mon D}` (`#6b7480`, mono-ish).
- **Photo (left):** square framed image with a **Cover** badge top-left; below it a dashed **"⬆ Upload Photo"** button. (Real impl: `photo-gallery.tsx` / `photo-uploader.tsx`.)
- **Card style:** surface `#161b21`, 1px hairline, radius 16px, **left brass spine** (`border-l-2 border-l-primary/40`), header = brass icon chip + serif 19px title.
- **Card 1 — Identity & Ownership** (icon 🏷️): rows (label `#8c95a0` left / value `#e6eaee` right, 12px vertical padding, hairline dividers): Brand, Model, **Nickname** (italic), Reference Number (mono), Serial Number (mono), Purchase Date (long format), **Purchase Price** (mono, brass), Notes (block). Empty → muted **"Not set"**.
- **Card 2 — Specifications** (icon ⚙️): **Movement** subsection (use existing `MovementPreview`: caliber name + a type pill + manufacturer / beat rate / power reserve); **Case** subsection rows: Case Material, Crystal, Case Diameter (mono), **Strap Width** (mono), **Lug-to-Lug** (mono), **Case Height** (mono), Water Resistance (mono), Dial Color; **Complications** subsection = wrap of outline badges from the comma-separated `complication` field. Section labels: 11px bold uppercase, `tracking-widest`, `#6b7480`, with a fading hairline.
- **Card 3 — Category & Labels** (icon 📂): Category row (badge with category color) + Labels (wrap of colored pills). Empty → muted "Not set".

---

## Interactions & Behavior
- **Home dial:** `setInterval(1000)` re-renders; `activeIndex` advances every 5s; caption cross-fades; "View watch" + clicking a thumbnail → detail.
- **View switch:** Table/Gallery persisted to `localStorage` (`collection-view`); size to `collection-gallery-size`; filters/sort persisted too (`collection-filters`, `collection-sort`). Category filter is **URL-driven** (`?category=<id>`).
- **Sort:** key + direction; missing values sort to the bottom regardless of direction.
- **Cards/rows:** entire card/row is a link to `/watch/[id]`.
- **Detail actions:** Wore Today (optimistic toast), Edit (navigate), Delete (confirm dialog → server action → redirect).
- **Hover:** cards lift + brass ring; table rows tint; buttons lighten.

## State Management
- Collection: `view`, `size`, `showCost`, `filters`, `sortKey`, `sortDir` (localStorage); selected category (URL). Derived: `applyFilters` → `sortWatches`.
- Detail: server-fetched watch + brand + movement + category + labels + `wearInfo` (count, lastWorn). No extra client state beyond action pending flags.
- Home dial: `now` (tick), derived `activeIndex`.

## Design Tokens (prototype values — map accent to brand `--primary`/brass)
**Fonts:** Display/serif = **Newsreader**; UI/sans = **Hanken Grotesk**; mono = **JetBrains Mono**. (In-repo: keep the existing `font-display` + sans + mono stack; these are the prototype's stand-ins.)
**Color:**
- Background base `#0f1318`; page gradient `#11161c → #0d1116`.
- Elevated surface `#181d24`; card surface `#161b21`.
- Hairline borders `rgba(255,255,255,.06–.10)`.
- Text: primary `#eef1f5`; secondary `#aab3bd` / `#8c95a0`; tertiary `#6b7480`; spec value `#e6eaee`.
- **Interactive accent (prototype) `#6ea2dd` → use brand brass `--primary`.**
- Price/brass `#c9a25e`.
- Dial navy `#16406b → #081a30`; second hand red `#c8402f`.
- Label pills: use existing `labelColorMap` (don't hardcode).
**Radius:** pills/badges 20px; buttons 8–12px; cards 13–16px; table container 14px; thumbnails 50%.
**Spacing:** toolbar gap 12–14px; card padding 14–24px; spec row vertical padding 12px; grid gaps 18px.
**Shadows:** card hover `0 16px 30px rgba(0,0,0,.4)`; dial case `0 26px 60px rgba(0,0,0,.55)`; thumbnails `0 3px 10px rgba(0,0,0,.5)`.
**Type scale (approx):** detail brand 38 / card title 19 / gallery brand 16 / table brand 15.5 / body 13.5–14 / mono meta 12 / eyebrow 11 (uppercase, tracked).

## Assets
- **Watch imagery:** the prototype draws CSS/SVG placeholder dials. Production uses real `cover_photo_url` thumbnails from Supabase (see `gallery-grid.tsx`). No new image assets are introduced by this design.
- **Icons:** lucide (`Table`, `LayoutGrid`) already in use; keep them.
- **Fonts:** load via the codebase's existing font setup.

## Files
- `CaliberShelf Redesign.dc.html` — the interactive HTML design reference (Home dial + Collection gallery/table + Watch Detail, with a Tweaks panel for accent & dial tint). Open it to see live behavior and exact spacing.

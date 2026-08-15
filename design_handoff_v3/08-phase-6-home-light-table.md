# 08 — Phase 6: The Light Table (home page)

Replaces the Living Dial. The home page becomes a light table: one enlarged
frame, that watch's contact sheet beside it, a loupe for inspecting detail, and
a rotation that steps through a **chosen set** of watches.

Visual spec: `screens/TenTenLoupe Home - Light Table.dc.html` (1120×900, light).
Read it before building — it is the layout, hierarchy and label wording, and it
is interactive: hover a thumbnail, hover the big frame, open the ROTATION menu.

## Why

`watch-hero.tsx` crops every cover twice — the square-to-circle mask, then
`dial_focal_x/y` + `dial_zoom` on top — inside a circle inset 4.82% of a 560px
case. Composed watch photography does not survive that: off-centre dials, macro
crops and negative space all become "a round window with a watch in it". The
dial-framing editor treats the symptom. The fix is to stop masking.

Two concepts were considered and rejected for the daily home page (both are in
`screens/TenTenLoupe Home Concepts.dc.html` if they are ever wanted): **1a
Gallery Print**, a single matted print, and **1c Editorial Spread**, a
full-bleed cover story. 1b won because it is the only one that shows the
photography *practice* rather than one output of it.

## What carries over from `watch-hero.tsx`

Everything except the mask. Do not reinvent these — lift them:

- Seeded shuffle for the initial order (`mulberry32`, server-generated seed) so
  SSR and hydration agree and each load differs.
- Per-device dwell from `readHeroDwellSeconds()` (`HERO_DWELL_KEY`, default 30s,
  the fixed `HERO_DWELL_OPTIONS` list). **No new dwell preference** — the mock's
  4–30s slider is a mock affordance only.
- Hover pauses the rotation; arrow keys step it.
- `prefers-reduced-motion` freezes the whole stage: no auto-advance, no ring
  sweep, no cross-fade.
- The wear line (`Worn 12 times · Last worn Jun 28, 2026`), now split into the
  ACQUIRED / WORN / LAST WORN triplet.
- The brass rim line keeps its exact job: it already laps once per minute as a
  live seconds hand, and becomes the dwell timer around the aperture icon.

The `home-stage.tsx` toggle stays, with the left label renamed **Light Table**
(from "Living Dial"). `DISPLAY_BOX_HOME_KEY` is unchanged — a saved "1" still
means Display Box.

---

## 1. Data

No migrations. Everything needed exists.

| Need | Source |
|---|---|
| Frames | `watch_photos` — `photo_url`, `angle` (00041), `sort_order`, `is_cover` |
| Angle labels | `watch_photos.angle` ∈ `flat · hero · profile · caseback · macro` (00041) — **five**, uppercased for display; `NULL` renders no stamp |
| Score | `watch_image_scores.composite_score` (00040) |
| Acquisition | `watches.purchase_date` (00002) |
| Wear | `watches.wear_count`, `watches.last_worn_date` |
| Wish-list tier | `watches.is_wishlist` |
| Guide sets | `guide_entries.watch_id` → `collection_guides.name` (00038) |
| Sold | `watches.sale_status` (00043) — excluded from rotation |

### The five rotation sets

```ts
type RotationSetId = "all" | "wish" | "recent" | `guide:${string}`
```

| Set | Membership |
|---|---|
| All Watches | not `is_wishlist`, not `sale_status = 'sold'` |
| Wish List | `is_wishlist = true` |
| Last 20 Acquired | owned, `ORDER BY purchase_date DESC NULLS LAST LIMIT 20` |
| Master Guide · Grand Seiko | watches linked from that guide's `guide_entries` |
| Master Guide · Swiss Artisans | same, other guide |

Guide sets are **derived from `collection_guides`, not hardcoded** — a third
guide must appear in the menu with no code change. Group them under a "Master
Guides" heading, in `collection_guides` order.

**Only watches with at least one photo enter a queue.** A light table with no
frame is not a state worth designing. So each set carries two numbers, both
shown in the menu and the eyebrow: the true set size, and how many have frames
(`22 CHAPTERS · 9 WITH FRAMES`). For Wish List and guide sets, "frames" often
means the guide-card images from `master-guides.md` §2.3, which is correct — a
wish-list watch you have never held still has a reference photograph.

Persist the chosen set per device in a new key beside the others in
`src/lib/preferences.ts`:

```ts
/** Home light table: which rotation set is showing. */
export const HOME_ROTATION_SET_KEY = "home-rotation-set"
```

Read it after mount (never during SSR — same pattern as `DISPLAY_BOX_HOME_KEY`),
falling back to `"all"`. An unknown or now-empty set also falls back to `"all"`.

### Query

One new file, `src/lib/queries/light-table.ts`:

```ts
export interface LightTableFrame {
  id: string
  url: string
  angle: PhotoAngle | null      // 'flat' | 'hero' | 'profile' | 'caseback' | 'macro'
  score: number | null          // watch_image_scores.composite_score
}

export interface LightTableWatch {
  id: string
  brandName: string
  model: string
  nickname: string | null
  referenceNumber: string | null
  caliberLine: string | null    // reuse watch-hero's metaLine()
  caseDiameterMm: number | null
  purchaseDate: string | null
  wearCount: number
  lastWornDate: string | null
  isWishlist: boolean
  guideChapter: string | null   // "Grand Seiko · chapter 4, the Shunbun texture dial"
  coveredAngles: number         // distinct non-null angles, 0–5
  frames: LightTableFrame[]     // hero angle first, then sort_order
}

export interface RotationSet {
  id: RotationSetId
  label: string                 // "Grand Seiko"
  displayName: string           // "MASTER GUIDE · GRAND SEIKO"
  isGuide: boolean
  total: number                 // true set size
  withFrames: number
  watches: LightTableWatch[]    // only those with frames
}
```

Fetch **all** sets in the page's server component in one pass (they overlap
heavily — one watch+photo+score query, partitioned in memory) so switching sets
is instant and needs no round trip. Cap each queue at 60 watches.

Frame order within a watch: the `hero` angle first (that is the frame the
rotation lands on), then `sort_order`, then `created_at`.

**Open question — the capture line.** The mock shows `f/9 · 1/160 · 9-FRAME
STACK`. Confirm what the pipeline actually stores before building that line: if
EXIF and stack depth are not persisted anywhere, render only the score and drop
the rest rather than inventing columns. If they are wanted, that is a separate
migration and its own decision — do not add one under this phase.

---

## 2. Screens

`src/app/(dashboard)/dashboard/_components/light-table.tsx` (client), replacing
`WatchHero` inside `home-stage.tsx`. Below `md` it stacks: frame, controls,
info, then the sheet.

### 2.1 Header

`On the table` (page title, 26px display) with the eyebrow beneath in mono
2xs: `{displayName} · {detail}` — brass for the set name, muted for the counts.

Right-aligned, the **ROTATION** control: a 34px bordered button showing
`layers` icon, the mono label `ROTATION`, the set's short name, and a chevron.
It opens a 300px popover listing all sets with their counts, a brass check on
the active one, the "Master Guides" group heading, and the footnote *"Only
watches with photographed frames enter the rotation."* Use the existing
`DropdownMenu` primitives, not a hand-rolled popover. An open menu pauses the
rotation.

### 2.2 The selected frame (480×320 at this width)

`object-contain` on a `--surface-photo` field — never `object-cover`, and no
focal point or zoom. The photo's own aspect is respected; letterboxing is
correct and preferable to cropping.

- Bottom-left caption, mono 2xs on a scrim: `HERO · GRAND SEIKO SBGA413`, or
  `UNTAGGED FRAME · …` when `angle` is null.
- Top-right angle stamp when tagged: uppercase mono 2xs, `--card` at 92% with
  full radius. (The mock has a `labelPlacement` tweak putting labels under the
  thumbnails instead; ship the stamp — it keeps the grid tight.)
- **Loupe**: on pointer-enter, a 168px circular window follows the cursor
  showing the same image at 2.4× (`background-size` scaled, positioned from the
  pointer's fractional offset), 3px `--card` border and a drop shadow, with the
  zoom factor in the corner. `pointer-events: none`. Hidden under
  `prefers-reduced-motion` and on touch (`(hover: none)`), where it would fight
  scrolling — tapping a thumbnail is the touch equivalent.

### 2.3 Controls row

Aperture ring (30px, `--brass` on `--border`, `stroke-dashoffset` driven by
elapsed/dwell) with the `aperture` glyph centred · `02 / 06` mono counter ·
Previous · Next · **Open watch** (brass, `arrow-up-right`) · right-aligned
status: `EVERY 30S`, or `PAUSED` while hovered.

The ring is the only moving element. Drive it from one 200ms interval that also
owns the advance — never a CSS animation plus a JS timer, which drift apart.

### 2.4 Info block

Under a hairline: watch title (19px display) and mono spec line
(`M79030N-0001 · MT5402 · 39MM`) on the left; the current frame's score and
capture line right-aligned. Then a three-column mono row — **ACQUIRED · WORN ·
LAST WORN**. Then, when the watch is linked to a guide entry, one brass
`compass` line naming the chapter.

Wish-list and guide-target watches show `—` for acquired and last worn and
`not yet owned` for wear count. Never `0 times` for a watch you do not own.

### 2.5 Contact sheet

Right column: `FRAMES` eyebrow, hairline, and `9 KEPT · 5 / 5 ANGLES`; then the
watch's frames in a 3-column grid of square `object-cover` thumbnails (a
thumbnail is a navigation target, so cropping is fine there). Hover or focus
raises a frame into the main view; the active tile carries a 2px brass outline
with 2px offset. Click opens that frame in the Photo Lab.

Beneath: the hint line, then a stats block pinned to the bottom — Coverage,
Frames kept this month, Awaiting review (brass, links to the review queue).

Keyboard: the grid is a real focusable list. `Tab` reaches it, arrows move
within it, `Enter` opens the Photo Lab. Do not build a hover-only affordance.

---

## 3. What happens to the dial and the framing editor

- `watch-hero.tsx`, `watch-dial.tsx` and the `.dial-sunburst` / lug / crown CSS
  are no longer reachable from home. **Delete `watch-hero.tsx`**; keep
  `watch-dial.tsx` only if `/about` still illustrates it.
- `dial_focal_x/y` and `dial_zoom` stay — `gallery-grid.tsx` still uses them for
  square collection thumbnails, where a centre-weighted crop of a composed frame
  is fine.
- `dial-framing-editor.tsx` therefore loses its headline job. Retitle it
  *Thumbnail framing*, and reword the copy: it no longer frames "the home-page
  watch face". A follow-up could retire it entirely in favour of the Photo Lab's
  hero-angle pick; not this phase.
- `/about` §Dial Framing copy must change — it currently promises "the home
  screen renders your collection as a living wristwatch dial", which will be
  false the moment this ships.

---

## 4. Build order

1. `src/lib/queries/light-table.ts` + `PhotoAngle` type export + the five-set
   partition, with guide sets derived from `collection_guides`.
2. `HOME_ROTATION_SET_KEY` in `preferences.ts`.
3. `light-table.tsx`: static layout first (frame, controls, info, sheet) against
   real data, no motion.
4. Interactions: hover-swap, keyboard grid, loupe.
5. Rotation: one interval, ring, counter, hover/menu pause, reduced-motion
   freeze, seeded shuffle.
6. ROTATION menu + set persistence.
7. Wire into `home-stage.tsx`, rename the toggle, delete `watch-hero.tsx`.
8. Copy sweep: `/about`, the framing editor's title and helper text.

## 5. Exit checklist

- [ ] No `object-cover` and no focal point/zoom on the selected frame; a
      portrait, a square and a landscape frame all display uncropped.
- [ ] Angle stamps use only the five 00041 classes; untagged frames show no
      stamp and no placeholder.
- [ ] Every set switch is instant (no network), and the eyebrow + menu counts
      agree with the queue length.
- [ ] A watch with no photos never appears; a set with no framed watches falls
      back to All Watches with a one-line explanation.
- [ ] Wish-list watches show `—` / `not yet owned`, never `0 times`.
- [ ] Dwell comes from `readHeroDwellSeconds()`; no second dwell preference.
- [ ] Hover pauses and the status text says `PAUSED`; arrow keys step; the
      thumbnail grid is fully keyboard-reachable.
- [ ] `prefers-reduced-motion`: no advance, no ring sweep, no loupe.
- [ ] Sold watches are excluded from every set.
- [ ] Nothing in the UI says "living dial" or promises a dial-framed home page.
- [ ] Verified in light mode at lg (200px rail), md (56px rail) and below md.

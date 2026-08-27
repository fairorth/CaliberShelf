# Photo Lab — the software

Reference for the Photo Lab **application**: screens, data, scripts, and the
exact route a photograph travels from the camera to the watch page.

Companion documents:

- [`photo-lab.md`](photo-lab.md) — the **craft**: camera, lens, lighting, C1
  recipe, EOS Utility mechanics. That file is the single source of truth for
  anything a photographer does; this one is the single source of truth for
  anything the software does.
- [`photo-lab-game-plan.md`](photo-lab-game-plan.md) — the tutorial and the
  campaign plan for shooting the whole collection.
- [`photo-scoring-agent.md`](photo-scoring-agent.md) — the design plan behind
  `photo-score.mjs`, including the phases not yet built.
- [`agents.md`](agents.md) — fleet-level operator reference and costs.

---

## 1. The pipeline in one picture

```
   CAMERA                    DISK                        DATABASE                 APP
   ──────                    ────                        ────────                 ───
                     \WatchImages\
   R10 + RF100mm  →   <Brand> <Model> [id]\  →  watch_image_scores  →  Photo Lab · Review
   (EOS Utility)        *.CR3  *.JPG                (one row per file)          │
                        _previews\                                              │ accept
                        _photo-report.html                                      ▼
                                                        watch_photos    →  Watch page · Home
   phone ──────────────────────────────────────────────────────┘         (Storage bucket)
```

Two distinct routes get a photo into `watch_photos`:

| Route | Source | Where it works | Produces |
|---|---|---|---|
| **Tethered** | Capture folder on disk | Only on the machine holding `\WatchImages` | Scored, graded, angle-tagged, reviewed |
| **Direct upload** | Phone / drag-drop / paste | Anywhere | Untagged photo, no score |

The tethered route is the one Photo Lab is built around. The direct upload is
the escape hatch — fast, but nothing scores or grades it.

---

## 2. Configuration — the one setting that gates everything

**Config → Settings → "Watch Images folder location"** writes
`profiles.watch_images_path` (migration 00035) via
`saveWatchImagesPath` in [`settings-actions.ts`](../src/lib/actions/settings-actions.ts).

Everything that touches disk reads it:

- `npm run sync-watch-folders` — where to create folders
- `npm run photo-score` — where to find frames
- `GET /api/photo-lab/frame/[scoreId]` — serving a frame into Review
- `promoteScoredFrame` — reading the original to publish it

**While this is null, the entire tethered half of Photo Lab is inert.** The
Session screen shows "No Watch Images folder configured" instead of a
destination path, Review can render nothing, and Accept fails. There is no
error banner on the Coverage screen telling you this — the screens simply have
nothing to show.

Resolution order for the two scripts is `--dir` > `WATCH_IMAGES_DIR` env >
`profiles.watch_images_path`, so a script can run without the setting; the app
cannot.

---

## 3. The five angles

`PHOTO_ANGLES` in [`src/lib/photo-lab.ts`](../src/lib/photo-lab.ts) is the
canonical list and its order is the coverage matrix's column order and the
`1`–`5` key mapping everywhere:

| # | Key | `PhotoAngle` | Long label (`ANGLE_LABELS`) | Heading (`ANGLE_HEADINGS`) |
|---|---|---|---|---|
| 1 | `1` | `flat` | Flat dial-on | `FLAT` |
| 2 | `2` | `hero` | Hero ¾ | `HERO` |
| 3 | `3` | `profile` | Profile | `PROFILE` |
| 4 | `4` | `caseback` | Caseback | `CASEBACK` |
| 5 | `5` | `macro` | Macro | `MACRO` |

Headings are ASCII and one word each — the film strip and matrix share five
equal columns, and a two-word or non-ASCII heading breaks the row (Phase 8 §10).

`watch_photos.angle` is nullable. An untagged photo is legal everywhere; it
just contributes nothing to coverage and sorts after tagged frames in the film
strip.

---

## 4. Screens

### 4.1 Coverage — `/photo-lab`

The "what do I shoot tonight" screen. A row per shootable watch, a column per
angle.

**Population:** owned watches only — wish-list entries have nothing to shoot,
and sold watches are no longer in hand (`getPhotoLabCoverage`). Today that is
**124 of 171** watches.

**Header line** reports three numbers:
- watches with a hero angle, out of the total
- watches with **no photo at all**
- frames **awaiting review**

**A cell** counts two independent things:
- `photoCount` — uploaded `watch_photos` carrying that angle
- `scoreCount` — scored capture-folder frames whose `angle_class` maps to it

**Sorting** defaults to worst coverage first — the matrix is a to-do list, not
a trophy case. Also sortable by best-first and by brand, filterable by box, and
by "never shot only" (which the *Reshoot list* button links to via
`?filter=never-shot`).

**Interaction:** clicking a cell opens a Session pre-set to that angle; clicking
the row opens the watch.

**Empty state:** when *no* photo anywhere carries an angle, the matrix is
replaced by a single explanatory panel rather than 124 identical `0/5` rows.
This is the state the app is in today.

### 4.2 Session — `/photo-lab/session`

The shoot is the unit of work. Pick one watch; everything else follows.

- **Session watch** persists to `localStorage` under `photo-lab-session-watch`,
  and Quick Capture inherits it. Reopening `/photo-lab/session` with no `?watch=`
  redirects to the stored one.
- **The destination path** is the prominent element:
  `<images path>\<Brand> <Model> [<8-char id>]`, with a copy button. This is
  what you paste into EOS Utility at the start of each watch.
- **Target angles** lists all five with a count each; the angle from `?angle=`
  is highlighted as "this session".
- **Frames landed** shows up to 60 scored frames for this watch, newest first,
  served from disk by the frame API.
- **Phone captures** is a multi-file drop/paste zone that uploads straight to
  `watch_photos` (untagged).
- **C1 pre-flight** is a collapsible copy of the camera checklist.

> **Drift risk:** the C1 checklist is hard-coded as `C1_CHECKLIST` in
> [`session-view.tsx`](../src/app/\(dashboard\)/photo-lab/session/_components/session-view.tsx)
> and duplicates the recipe in `photo-lab.md`. Change one, change the other.

### 4.3 Review — `/photo-lab/review`

Keyboard-first judging of scored frames, one at a time, at size.

**Queue:** every `watch_image_scores` row that is not a stack `source` and whose
`review_state` is `unreviewed`. Stack sources never appear — you judge the
composite, not its thirty ingredients.

| Key | Action |
|---|---|
| `→` / `←` | Next / previous frame |
| `1`–`5` | Tag angle (press again to clear) |
| `A` | **Accept** — publish with the current angle |
| `C` | **Accept and set as cover** |
| `R` | **Reject** — marks the row only; never touches the file on disk |
| `Z` | Toggle 100% zoom (serves the original rather than the preview) |

The side panel shows the letter grade, the CV metric bars, the shot-card verdict
and any named defect. A duplicate cluster renders as a thumbnail row with the
CV-chosen best highlighted.

**Accept is publication.** `promoteScoredFrame` reads the original from disk
(CR3 → embedded `JpgFromRaw` via ExifTool; anything else read directly),
re-encodes to a **2000px long-edge JPEG at quality 85**, uploads to the
`watch-photos` bucket, generates a thumbnail, records `image_width` /
`image_height` **of the encoded JPEG** (not the RAW — migration 00048), inserts
the `watch_photos` row with the chosen angle, optionally promotes it to cover,
and links the score row with `review_state = 'accepted'`.

The first photo on a watch becomes the cover automatically, whether or not you
pressed `C`.

**Accept only works on the machine holding the capture folders.** Elsewhere it
returns "Review promotion only works on the machine that holds the capture
folders."

### 4.4 Quick Capture — `/capture`

Phone-first. Inherits the Photo Lab session watch, shoots repeatedly into a
filmstrip with per-frame undo, uploads in the background. Every upload path
downscales client-side to a 2000px long edge before leaving the browser
(`downscaleImage`), which keeps HEIC phone frames under the server-action body
limit and converts them to JPEG so thumbnailing works.

### 4.5 Tagging angles on photos you already have

Not in Photo Lab at all — it lives on the **watch page**. Open a photo in the
lightbox and press `1`–`5`, or click the angle pills. Other lightbox keys:
`←` / `→` navigate, `+` / `-` zoom, `C` set cover, `X` delete, `Esc` close.

This is the only way to tag the photos already in the collection, and it is
one photo at a time. **There is no bulk angle-tagging tool.**

---

## 5. Scripts

### 5.1 `npm run sync-watch-folders`

Creates one folder per watch under the parent, named
`<Brand> <Model> [<8-char-id>]`. Idempotent, matched by the `[id]` token — so
renaming the readable half never creates a duplicate.

```bash
npm run sync-watch-folders -- --dry-run
```

Flags: `--dry-run`, `--prune` (moves orphaned folders to `_removed`, asks
first), `--dir "D:\Path"`.

The naming is duplicated in `watchFolderName()`
([`src/lib/photo-lab.ts`](../src/lib/photo-lab.ts)) so the Session screen can
display the path without the script — the two must stay byte-identical.

### 5.2 `npm run photo-score`

Local-only. Reads capture folders, writes `watch_image_scores` and a
self-contained `_photo-report.html` per folder.

```bash
npm run photo-score -- --dry-run --limit 2      # always do this first
npm run photo-score -- --no-ai                  # Layer 1 only, $0
npm run photo-score -- --watch <uuid>
```

Flags: `--dry-run`, `--no-ai`, `--force` (re-score already-scored frames),
`--limit N`, `--watch <uuid>`, `--dir`, `--model`. Unknown flags hard-fail by
design.

**Layer 1 — CV triage (free, deterministic):**

1. **Hash + EXIF** every file. Content hash is the idempotency key
   (`onConflict: watch_id,content_hash`), so re-running is safe and cheap.
2. **Stack collapse.** CR3s sorted by `DateTimeOriginal`; consecutive frames
   under `STACK_GAP_MS` (2 s) form a run; runs of `STACK_MIN_FRAMES` (5) or
   more are bracket sequences. Each collapses to the in-camera composite —
   the nearest Canon-named JPG/HEIF landing within `COMPOSITE_WINDOW_MS`
   (2 min) after the run. Sources get `stack_role = 'source'` and are excluded
   from everything downstream. A sequence with no composite is flagged
   `unstacked`.
3. **CV metrics** on one greyscale decode at 768px long edge, over a **centre
   crop of 60%** treated as the dial ROI:
   - `sharpness_roi` — Laplacian variance
   - `brightness` — ROI mean luma (**dial ROI only, not the whole frame** —
     do not reuse this for a full-frame scrim)
   - `glare_fraction` — share of ROI pixels above luma 250
   - `phash` — 9×8 difference hash, 64 bits
4. **Duplicate clustering** — union-find over phashes with Hamming distance
   ≤ 10. Each cluster keeps its sharpest member as `dup_best`.
5. **Previews** — `_previews/<hash16>.jpg` at 640px, regenerable, used by the
   HTML report and the in-app frame API.

**Layer 2, Track A — shot-card grading (Haiku 4.5, ~$0.0015/frame):**

Only CV survivors reach the model — never stack sources, never non-best
duplicates. That is the whole economy: cheap CV in bulk, AI on the survivors.
The grader returns `{matched_card, pass, defect}` — objective pass/fail with a
named defect, never an aesthetic score.

The four cards (`SHOT_CARDS`) are `overhead_dial`, `caseback`, `crown_side`,
`lug_low`. A frame matching none is labelled `creative` and routed to Track B.

**Outputs:** `watch_image_scores` rows, plus `_photo-report.html` in each
folder — frames sorted by score, sequences collapsed and expandable,
duplicates grouped, coverage matrix and reshoot list at the top, relative
`<img>` paths so originals are one click away. Written **before** the DB
round-trip, so a database failure still leaves a usable report.

---

## 6. Data model

`watch_image_scores` (migration 00040) — one row per file on disk:

| Group | Columns | Written by |
|---|---|---|
| Identity | `watch_id`, `user_id`, `rel_path`, `content_hash`, `source_kind` | scorer |
| Stack | `stack_seq`, `stack_role` | scorer (Layer 1) |
| CV | `sharpness_roi`, `brightness`, `glare_fraction`, `phash`, `dup_group`, `dup_best` | scorer (Layer 1) |
| Track A | `shot_card`, `card_pass`, `ai_primary_defect`, `ai_model` | scorer (Layer 2A) |
| Track B | `angle_class`, `ai_dial_focus`, `ai_framing`, `ai_reflections`, `ai_background`, `ai_lighting`, `ai_color`, `ai_detail`, `ai_unusable` | **nothing — not built** |
| Ranking | `composite_score`, `hero_for_class` | **nothing — not built** |
| Review | `review_state`, `reviewed_at`, `watch_photo_id` | Review screen |

`watch_photos` — the published photo:
`storage_path`, `thumb_path`, `angle`, `is_cover`, `display_order`,
`sort_order`, `image_width`, `image_height` (00048).

`getWatches` returns two cover URLs: `cover_photo_url` (~720px) for heroes and
tiles, `cover_thumb_url` (~192px) for anything under ~100px.

---

## 7. Known gaps — read before planning a session

These are real limitations of the code as it stands, not wishlist items.

### 7.1 Track B is not built, and it silently disables half of Coverage

`photo-score.mjs` never computes `composite_score` or `angle_class`. Both are
only ever carried forward from a prior row:

```js
angle_class: r.existing?.angle_class ?? null,
composite_score: r.existing?.composite_score ?? null,
```

Consequences, all of which look like bugs but are unbuilt features:

- **Scored frames contribute nothing to the coverage matrix.**
  `angleFromScoreClass(null)` returns `null`, so `scoreCount` never increments.
  Coverage is driven **entirely by `watch_photos.angle`.**
- Cell grades never appear — `bestScore` is always `null`.
- Review's angle pills never pre-seed; every frame must be tagged by hand.
- Session frame thumbnails never show a grade badge.

Track B is Phase 3 of [`photo-scoring-agent.md`](photo-scoring-agent.md).

### 7.2 The shot cards and the five angles are different vocabularies

Four cards (`overhead_dial`, `caseback`, `crown_side`, `lug_low`) against five
angles (`flat`, `hero`, `profile`, `caseback`, `macro`). They overlap but do
not correspond, and nothing maps one to the other. In particular **there is no
card for the hero ¾** — the angle the Coverage header counts. A hero shot
grades as `creative`.

### 7.3 No bulk angle tagging

168 photos currently carry no angle. The only tool is the watch-page lightbox,
one photo at a time.

### 7.4 State of the data today

| | |
|---|---|
| `profiles.watch_images_path` | **null — nothing on disk is reachable** |
| `watch_image_scores` | **0 rows** |
| `watch_photos` | 168, **all untagged** |
| Watches with ≥1 photo | 163 of 171 |
| Shootable watches (owned, not sold) | **124** |
| Coverage matrix | showing its empty state |

Past `photo-score` runs exist in `agent_runs` (Aug 10, three successes and two
failures, $0.0077 total), but left no surviving score rows.

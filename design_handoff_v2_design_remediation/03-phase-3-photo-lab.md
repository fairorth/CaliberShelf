# 03 — Phase 3: the Photo Lab

Two findings (D1, D3), and the reason to build v2 at all. **Do not start until Phase 2
has landed** — this reuses the watch view page (A1), the nav rail (A2), the shared upload
component (A3) and the type scale (E3).

**Read `docs/photo-lab.md` in the repo before designing anything here.** It is the source
of truth for the physical workflow and it is unusually well specified. This phase is about
giving that workflow an interface — not inventing a new one.

---

## D1 — There is no Photo Lab in the app  ·  CRITICAL

### What exists today

- **A rigorous physical workflow, documented:** the R10 C1 preset (M · ISO 100 · f/8 ·
  fixed WB · RAW · One-Shot 1-point · back-button AF · *Continue focus search*),
  overhead geometry (~16–20″, watch fills 70–80% of frame), the EOS Utility
  double-click-to-AF flow and nudge keys, focus-bracketing parameters (30 shots ·
  increment 3 · exposure smoothing on · depth composite on).
- **Folder-per-watch capture routing:** `<Brand> <Model> [<8-char-watch-id>]` under the
  `\WatchImages` parent, created by `npm run sync-watch-folders`, parent path in
  `profiles.watch_images_path` (migration 00035, editable at Config → Settings).
- **A CV + AI triage script:** `scripts/photo-score.mjs` → `watch_image_scores`
  (migration 00040). Extracts the embedded `JpgFromRaw` from CR3 via ExifTool, does stack
  collapse, dial-ROI sharpness, duplicate clustering, plus Track A shot-card grading
  (Haiku, ~$0.0015/frame, `--no-ai` free), and writes a **local**
  `_photo-report.html` with a coverage matrix and a reshoot list.
- **In the app: none of it.** Photography is one uploader button and a grid of
  undifferentiated squares. The scores table is migrated and unread.

### What to build

A top-level **Photo Lab** destination (nav group: Acquisition & Imagery) with three views.
**Coverage and Review are mocked — `04-screen-specs.md` §3 and §4 are authoritative.**
The **Session** view is not mocked: build it in the same shell and idiom, to the
description below.

#### 1. Coverage — "what still needs shooting"

A **watch × angle matrix**: rows are watches (owned, non-wishlist), columns are the five
angle classes named in `photo-lab.md`: **flat dial-on · angled/three-quarter hero ·
side profile · caseback/clasp · macro detail**.

- Each cell: empty (needs shooting) · has frames (count) · has a *scored* frame with its
  grade. Colour by state using the design-system tokens — brass only for the action
  ("shoot this"), never as a heat map.
- Row header: thumbnail + brand/model, linking to the watch view page.
- Sort/filter: worst coverage first, by box, by tier, by "never shot".
- A summary line: `18 of 34 watches have a hero angle · 6 have no photo at all`.
- Cell click → start a Session for that watch pre-set to that angle.

This replaces reading a coverage matrix out of a locally generated HTML file, and it is
the single most useful screen in the phase: it turns "what do I shoot tonight" into a
glance.

**Data:** requires an **angle tag per photo**. Add `watch_photos.angle` (nullable enum:
`flat` · `hero` · `profile` · `caseback` · `macro`) as a new migration, editable from the
lightbox (D2, Phase 1) and set during Review. Backfill is manual — that's fine.

#### 2. Session — the shoot is the unit of work

Today the app has no concept of a shoot. `photo-lab.md` says the linkage is *"point the
EOS Utility destination at the session watch's folder at the start of each session"* —
so the app should own that context.

- Pick the watch (or arrive from a Coverage cell) → a session view showing:
  - the watch, its target angles and which are already covered;
  - its capture folder path, copyable in one click (from `profiles.watch_images_path` +
    the `<Brand> <Model> [<id>]` convention) — this is the value that has to be pasted
    into EOS Utility;
  - the **C1 checklist** rendered from `photo-lab.md`'s recipe as a short pre-flight list
    (mode/ISO/aperture, IS off on tripod, focus limiter, *Continue focus search*,
    destination = PC + card) — read-only, collapsible;
  - the frames landed so far for this watch, newest first, with scores when present;
  - the shared upload component (A3) for phone captures, in **multi-frame** mode.
- Persist the active session watch (localStorage is enough) so returning to Photo Lab
  resumes it, and so Quick Capture (D3) inherits it.

Do **not** try to control the camera or watch the filesystem from the browser — the
tether station and `photo-score.mjs` own that. The session view's job is context,
checklist and the folder path.

#### 3. Review — judge frames at size, in one pass

Render what `photo-score.mjs` already writes to `watch_image_scores`.

- Pick a run (or "unreviewed frames") → frames **large, `object-contain`, one at a time**,
  with the score data visible: dial-ROI sharpness, stack-vs-single flag, duplicate-cluster
  membership, and the Track A shot-card grade with its reasoning.
- Keyboard-first, because this is a volume task: `←`/`→` next/previous, `A` accept,
  `R` reject, `C` set as cover, `1`–`5` tag angle, `Z` toggle 100% zoom (crop to the dial
  ROI the scorer used — that's the pixel region the score is about).
- Respect the semantics `photo-lab.md` calls out: **stacked composites are sharp
  everywhere by design; singles are sharp only at the focal plane.** Never present a
  shallow-DoF single as "worse" than a composite — show the class alongside the number.
- Accepting a frame should be able to promote it into `watch_photos` (upload + thumbnail
  + optional cover + angle tag) so review and publication are one action.
- Show the run's cost and item counts, consistent with the Agent Execution Review report
  — the app's agent-transparency pattern is a strength; extend it here rather than
  inventing a second style.
- A **reshoot list** view: frames/angles the scorer flagged, grouped by watch, each linking
  into a Session.

### Acceptance for D1

- Photo Lab is a nav destination with Coverage, Session and Review.
- The coverage matrix answers "what needs shooting" without running a script.
- `watch_image_scores` rows are visible in the app.
- A frame can go from scored → accepted → cover, with an angle tag, without leaving Review.
- Nothing here requires reading a local `_photo-report.html`.

---

## D3 — Quick Capture has the flow inverted  ·  HIGH

**File:** `src/app/(dashboard)/capture/_components/quick-capture.tsx`

**Current:** capture → select watch from a grid of the entire collection → confirm → one
frame per pass. A real session is one watch and many frames over several minutes, so the
flow costs three interactions per frame and asks the identifying question after the shot.
The route is also in no nav group (see A3).

**Implement:**

1. **Invert the order.** Choose the watch first — or inherit the active session watch from
   the Photo Lab (D1) — then shoot repeatedly. Show the watch as a persistent header
   (thumbnail + brand/model + "change").
2. **Filmstrip feedback:** each captured frame appears immediately in a strip with an undo
   affordance; uploads run in the background. No per-frame confirm step.
3. **Multi-select from the gallery** in one action (the shared component from A3 supports
   it).
4. Replace the 128px emoji shutter and the text step indicator with a real shutter control
   and the design-system's icon set (E2). The step indicator becomes unnecessary once the
   flow is watch-first.
5. Reachable from the nav under Photo Lab, not a bare `/capture` URL (`DECISIONS.md` §5).

**Acceptance:** shooting ten frames of one watch takes ten interactions, not thirty; the
watch is chosen once; every frame is visible immediately with an undo path.

---

## Migrations this phase implies

1. `watch_photos.angle` — nullable enum (`flat` · `hero` · `profile` · `caseback` ·
   `macro`), plus an index if the coverage query needs it.
2. `watch_photos.sort_order` — integer, if D2's drag-reorder wasn't done in Phase 1.
3. A review state on scored frames — e.g. `watch_image_scores.review_state`
   (`unreviewed` · `accepted` · `rejected`) + `reviewed_at`, so Review is resumable.

Follow the repo's own migration conventions (`supabase/CLAUDE.md`,
`.claude/skills/db-migration`), regenerate database types afterwards, and keep RLS
consistent with the existing ownership pattern.

---

## Phase 3 exit checklist

- [ ] Photo Lab in the nav with Coverage / Session / Review
- [ ] Angle tags exist and are settable from the lightbox and from Review
- [ ] Coverage matrix reads real data and links into Sessions
- [ ] Review renders `watch_image_scores` and can promote a frame to cover
- [ ] Capture is watch-first with a filmstrip
- [ ] Migrations applied, types regenerated, RLS verified
- [ ] `npm run lint && npm run typecheck && npm run build` clean

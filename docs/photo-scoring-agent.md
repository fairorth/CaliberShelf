# Photo Scoring Agent — Implementation Plan

**Status:** Phases 1–2 BUILT (v1.7.0–1.7.1): CV triage + Track A shot-card grading (Haiku 4.5), coverage matrix + reshoot list in the folder report and DB. CR3 embedded-preview resolution verified full-res on a real R10 file (plan 3.1 → option b confirmed, no LibRaw fallback needed). The four-card starter set (3.6) ships as the `SHOT_CARDS` constant in `scripts/photo-score.mjs` — edit there to confirm/extend. Next: Phase 3 (Track B rubric + comparative hero ranking). Plan v1.1.
**v1.1 (2026-08-09):** joint review pass — adds the two-track shot-card/creative design, stack-sequence collapse, ROI and glare corrections, the local HTML culling report, and comparative ranking as the hero mechanism. v1.0 was authored in the VacationRecap project.
**Purpose:** Automatically grade the images of each watch so the best shots can be *kept* (cull the capture folder), *highlighted* (nominate a cover/hero), and *audited for coverage* (every watch has its standard shots, or a reshoot list says what's missing) — realizing the "AI image-selection agent (planned)" section of [photo-lab.md](photo-lab.md).
**Reference implementation:** VacationRecap's image-quality evaluation (CV triage + AI vision). See that project's `docs/Image-Quality-Evaluation.md` for the technique breakdown; this document adapts it to TenTenLoupe's schema, storage, agent framework, and the watch-photography domain.

**Why this matters (product direction):** to date TenTenLoupe is a watch *tracker* — arguably a very good one, but one of many. A first-class watch *imaging* pipeline — standard shot lists with automated pass/reshoot verdicts, AI-assisted culling and hero selection, tethered-lab integration — is something no tracker offers. This agent is the first step of that pivot: images stop being attachments and become a managed asset class of their own.

---

## 1. Goal & scope — two tracks

A watch accumulates many images: a capture session drops dozens of `.CR3` frames, in-camera `.JPG`/`.HEIF` focus-stack composites, and finished Luminar Neo exports into the per-watch folder under `\WatchImages` (photo-lab.md → "Capture files → the watch folder"). Only a few deserve upload to the `watch-photos` bucket, and one becomes the cover.

The lab produces two kinds of shots, and they need different treatment:

- **Track A — Standard shots (pass/fail, no human cull).** A fixed shot list every watch gets: the straight overhead dial shot, caseback, crown-side, low-angle lug/case, … (the "shot cards", §3.6). These have a *known correct answer* — the evaluator checks each candidate against its card's spec and returns **pass** (keep the best passing frame) or **fail → reshoot** (with the defect named). Output per watch is a **coverage matrix**: every card → best passing frame, or "needs reshoot: <reason>". No aesthetic judgment, no human culling required.
- **Track B — Creative shots (cull + full evaluation).** Props, flat-lay sets, colored backgrounds, artistic angles — whatever the session inspired. These go through CV culling, duplicate collapse, full aesthetic grading (focus, lighting, composition, artistic merit), and comparative hero ranking, with a human review step.

Non-goals for v1: automatic deletion (we *suggest*, mirroring VacationRecap's "suggest, don't auto-act" and TenTenLoupe's fill-empty/human-verify norms), and RAW *development* (Luminar Neo stays the developer).

---

## 2. Architecture — three layers, mapped to TenTenLoupe conventions

The reference design splits into a free deterministic layer and a paid AI layer. TenTenLoupe has precedent for both: `deal-check.mjs` is the "$0, no model" proof, and `price-check.mjs` is the LLM-agent template. The scoring agent is a **local batch script** (like `chronoscout-sync` and `sync-watch-folders`) because the CV layer needs raw pixel access to local capture files, which the web app cannot touch.

| Layer | Role | Model? | TenTenLoupe precedent |
|---|---|---|---|
| **1. CV triage** | Stack-sequence collapse, sharpness (ROI), exposure, glare, near-duplicate clustering | No — deterministic, free | `deal-check.mjs` (deterministic, $0) |
| **2. AI evaluation** | Card matching + pass/fail (Track A); angle class + rubric + comparative ranking (Track B) | Yes — Claude vision, structured outputs | `spec-fetch` (structured outputs), `price-check.mjs` (batch + agent_runs) |
| **3. Composite + write-back** | Coverage matrix, composite scores, hero flags; `agent_runs` logging; local HTML report | — | `agent-run.mjs` logging helper, `/reports/agents` |

Run order per watch: **CV on every frame first** (collapses stack sequences and removes duplicates/technical failures for free), then **AI only on the survivors** — the "cheap CV in bulk, AI on the survivors" economy.

---

## 3. Resolved domain decisions

### 3.1 File formats — the CR3 problem
`sharp` cannot decode Canon `.CR3`. Adopt **extract the embedded JPEG preview** — every CR3 carries one — leaving the lab workflow untouched (photo-lab.md option b).

- Use **ExifTool** (`exiftool-vendored` in Node — a NEW dependency, ships its own binary, Windows-friendly) to extract the largest embedded preview to a temp file, then feed that JPEG to `sharp` for CV metrics and the AI resize step. **Build-time check:** verify with one real R10 file that the embedded preview is full-resolution (Canon typically embeds full-size; confirm before trusting ROI sharpness). Fallback if it isn't: LibRaw demosaic, as VacationRecap does for DNG.
- `.JPG`/`.HEIF` (in-camera composites) and Luminar exports decode directly via `sharp` (HEIF via a `heic-decode` fallback if libheif lacks HEVC — also a new dependency).
- Record the source file's `kind` (`cr3` | `jpeg` | `heif` | `export`) so scoring is class-aware.
- `content_hash` is computed over the **original file bytes** (the CR3, not the extracted preview) so idempotency survives extraction-pipeline changes.

### 3.2 Where the images live — local folder vs Supabase bucket
- **Capture-folder scoring (primary):** the agent reads the per-watch folder under the `\WatchImages` parent (path from `profiles.watch_images_path`, migration 00035; folders created by `sync-watch-folders.mjs`). This is where the *many* frames live — keep/reshoot/cull is decided **before** upload. Local-only script, like `chronoscout-sync`.
- **Uploaded-photo hero selection (secondary):** score existing `watch_photos` rows (bucket objects) to nominate `is_cover`. Same scorer, downloaded via service role or scored at upload time.

Build the capture-folder flow first (biggest pain, most images); reuse the scorer for uploaded photos later. Both write to the same store (§4).

### 3.3 Sharpness semantics — ROI per pool, don't punish shallow DoF
photo-lab.md's caveat: stacked composites are sharp everywhere; singles are sharp only at the focal plane. Mitigations:

1. **Region-of-interest sharpness — with the right ROI per pool.** `dial_focal_x/y` (migration 00013) are coordinates **on the uploaded cover photo** — they do NOT transfer to capture-folder frames with different compositions. So: for **capture-folder frames**, use a **center crop (~60%)** as the dial ROI — reliable *because* the lab rig is disciplined (fixed overhead camera, watch filling 70–80% of frame per the shooting checklist). For **uploaded `watch_photos`**, use `dial_focal_x/y` when present. "In focus" then means "the dial is sharp" in both pools.
2. **Class-relative comparison.** Never rank a shallow-DoF single against a focus-stacked composite on global sharpness. Compare within card/angle class, treating composite/single as metadata, not a penalty.

### 3.4 Angle classification (Track B primitive)
The AI layer classifies each creative survivor into: `flat_dial_on`, `angled_hero`, `side_profile`, `caseback_clasp`, `macro_detail`, `other`. Hero selection picks the best image **per class per watch** — a strong dial-on *and* a strong angled hero, not five near-identical dial-ons. (Track A doesn't need this — each card *is* its class.)

### 3.5 Glare — dial-scoped and lenient
Watch photography is "the controlled shaping of reflections" (photo-lab.md): specular highlights on case edges are deliberate craft (that's what the white cards are for). So:

- Measure `glare_fraction` (luminance > 250) **inside the dial ROI only** — not the whole frame, not the case/bezel.
- Gate **leniently**: a clipped bezel edge is technique; a blown patch over the dial hiding detail is a defect. The gate threshold starts permissive and tightens only with evidence.

### 3.6 Standard shot cards (Track A — new in v1.1)
A constant `SHOT_CARDS` list (in the script; promotable to a config table later) defines the shots every watch must have. Initial set, to be confirmed/extended by the user:

| Card key | Shot | Pass criteria (sketch) |
|---|---|---|
| `overhead_dial` | Fixed straight overhead, dial parallel | Dial ROI sharp; dial fully in frame with margin; glare gate; dial text legible |
| `caseback` | Case back | Caseback centered and sharp; engravings legible |
| `crown_side` | Crown + crown-side edge | Crown in focus; side profile visible |
| `lug_low` | Low angle at lug/case connection | Lug junction in focus; intentional angle |

Each card carries: expected subject/angle, framing expectation, and objective pass criteria. The AI evaluator receives the card spec and the frame, and returns `{matches_card, pass, defect}` — **pass/fail with a named defect**, not a 1–5 aesthetic score. Per watch, the best passing frame per card is the keeper; a card with no passing frame lands on the **reshoot list**. Frames matching no card are routed to Track B.

### 3.7 Focus-stack sequences — collapse before anything else (new in v1.1)
A single bracketing run drops ~30 CR3s that are *deliberately* soft outside one focal plane each — they are raw material, never keep/hero candidates. Scoring them individually is noise; AI-grading them is wasted spend. Don't rely on phash clustering to catch them (a focus ramp shifts the hash progressively and long ramps can chain-break). Instead:

- **Detect sequences explicitly**: EXIF `DateTimeOriginal` bursts (the R10 fires the whole bracket from one trigger — frames land seconds apart in strict sequence; focus-distance EXIF corroborates when present).
- **Collapse each sequence to one unit** represented by its in-camera composite (matched by timestamp adjacency). Source frames get `stack_seq` set and are excluded from AI grading, cull suggestions, and the HTML report's main grid (shown collapsed, expandable).
- **Contingency — external stacking software** (if the lab later moves from in-camera compositing to Helicon/Zerene): burst detection still identifies the sequence; the representative becomes the matching Luminar/Helicon *export* (by filename/time proximity), or, if none exists yet, the sequence is flagged "unstacked — needs external composite" instead of graded. The collapse logic survives the workflow change; only the representative lookup changes.

Not every image uses stacking — singles pass through untouched. This section is purely about not drowning in bracket frames.

---

## 4. Data model changes

`watch_photos` (00003; `id, watch_id, user_id, storage_path, display_order, caption, is_cover, thumb_path, created_at`) has no scoring columns, and capture-folder frames aren't rows in it at all. **Decision: Option B — a new table** `watch_image_scores`, keyed by watch + content hash, covering any image whether uploaded or still local; optionally linked to `watch_photos.id` once uploaded. Keeps scoring data separate from presentation.

Proposed migration **`00040_create_watch_image_scores.sql`** (renumbered — 00038 became collection guides, 00039 the inspiration gallery; house style: owner-scoped RLS `auth.uid() = user_id`, `IF NOT EXISTS`; **owner-only** — no public-read policy for now):

```
watch_image_scores
  id                uuid pk
  watch_id          uuid  -> watches(id) on delete cascade
  user_id           uuid  -> auth.users(id) on delete cascade
  watch_photo_id    uuid  null -> watch_photos(id)   -- set once uploaded
  source_kind       text  -- 'cr3' | 'jpeg' | 'heif' | 'export'
  rel_path          text  -- path within the watch's capture folder
  content_hash      text  -- over ORIGINAL file bytes; dedupe / idempotent re-runs
  -- Stack collapse (§3.7)
  stack_seq         int   null  -- sequence number within this watch; null = not a stack frame
  stack_role        text  null  -- 'source' | 'composite' | 'unstacked'
  -- CV (Layer 1, free, deterministic)
  sharpness_roi     real  -- Laplacian variance on the dial ROI (center crop / dial_focal per §3.3)
  brightness        real  -- mean luminance 0-255 (subject region)
  glare_fraction    real  -- clipped-highlight fraction in DIAL ROI (§3.5)
  phash             text  -- 64-bit dHash (hex)
  dup_group         int   null
  dup_best          bool  default false
  -- Track routing + AI (Layer 2)
  shot_card         text  null  -- card key (Track A) | 'creative' (Track B) | null (unscored)
  card_pass         bool  null  -- Track A verdict
  angle_class       text  null  -- Track B: flat_dial_on | angled_hero | side_profile | caseback_clasp | macro_detail | other
  ai_dial_focus     int   null  -- 1..5 (Track B rubric)
  ai_framing        int   null
  ai_reflections    int   null
  ai_background     int   null
  ai_lighting       int   null
  ai_color          int   null
  ai_detail         int   null
  ai_primary_defect text  null  -- <=6 words or NONE (both tracks)
  ai_unusable       bool  default false
  ai_model          text  null  -- audit, like watch_valuations.agent_model
  -- Layer 3
  composite_score   real  null
  hero_for_class    bool  default false
  scored_at         timestamptz
  created_at        timestamptz default now()
  unique (watch_id, content_hash)
```

Write via the **service role** from the local script, consistent with the other agents.

---

## 5. Layer 1 — CV triage (deterministic, free)

Port VacationRecap's `triage.ts` with the watch-domain changes:

- **Stack-sequence collapse first** (§3.7) — before any per-frame scoring, so everything downstream sees representatives, not ramps.
- **Sharpness (ROI):** grayscale → dial-ROI crop (§3.3) → resize 256px → 3×3 Laplacian `[0,1,0,1,-4,1,0,1,0]` → variance. Higher = sharper.
- **Brightness:** mean of channel means over the subject region, 0–255.
- **Glare fraction:** clipped-pixel share inside the dial ROI (§3.5).
- **Perceptual hash:** 9×8 grayscale dHash → 64 bits → hex.
- **Duplicate clustering:** union-find on phash with `HAMMING_MAX = 10`, **no time window** (cluster within the watch's set regardless of timestamp). `dup_best` = highest `sharpness_roi` in the cluster (near-identical frames share a class by construction).

Thresholds for "weak" flags: VacationRecap's **relative** blur cutoff (bottom-percentile sharpness) computed **per watch**, plus an absolute glare/exposure guard. Per-watch percentiles keep a low-light session from being globally condemned.

This layer alone (no AI) already delivers stack collapse + cull suggestions for free — shipped as Phase 1 before spending a cent.

---

## 6. Layer 2 — AI evaluation (Claude vision, structured outputs)

Follow the `spec-fetch` structured-output pattern and the `price-check.mjs` batch/logging skeleton. **Image prep** for both tracks: resize decoded frame to ≤1024px longest edge, JPEG q82, base64. **Grounding:** brand, model, reference, `source_kind`/composite flag as text context.

### 6a. Track A — card evaluator (pass/fail)
For each CV-surviving frame, one cheap classification+verdict call (or one batched call per watch with all candidates):

```json
{
  "matched_card": "overhead_dial|caseback|crown_side|lug_low|none",
  "pass": true,
  "defect": "<=6 words or NONE"
}
```

`matched_card: "none"` routes the frame to Track B. Per card, best passing frame wins `card_pass = true`; cards with zero passing frames feed the **reshoot list**. Suited to **Haiku** — the judgments are objective (right subject? in focus? legible?), which is where small models are reliable.

### 6b. Track B — creative evaluator (rubric + comparative ranking)
- **Rubric pass** (per image, structured): angle class + the 1–5 rubric (`dial_focus, framing, reflections, background, lighting, color, detail_visibility`) + `primary_defect` + `unusable`. This produces the per-image *data*.
- **Comparative ranking pass (the hero mechanism — promoted from "optional" in v1.0):** per watch and angle class, one call with the top-N rubric survivors: "rank these N images of the same watch; which is the strongest and why." Vision models are meaningfully better at relative judgment than at absolute rubric consistency across calls — the comparative verdict, not the rubric sum, decides `hero_for_class`. It's also cheaper than N independent deliberations.

**Model:** top-of-file `MODEL` constants (fleet convention) — Haiku default for Track A, Sonnet for Track B rubric, Sonnet/Opus for the comparative pass. **Resilience:** exponential backoff on 429/5xx; schema-parse guard marks `ai_unusable` rather than storing garbage.

---

## 7. Layer 3 — Composite, coverage & hero selection

- **Track A output:** the per-watch **coverage matrix** — each shot card → keeper frame or "needs reshoot: <defect>".
- **Track B composite:** gate on critical CV signals (badly soft or dial-blown frames can't be heroes), then `composite = criticalGate × weightedMean(rubric)`; weights in a constant block (tunable without migration).
- **Hero:** per watch per angle class, the comparative-pass winner gets `hero_for_class = true`; the single strongest overall is the cover **nominee** (surfaced, never auto-applied to `is_cover`).

---

## 8. The script — `scripts/photo-score.mjs`

Mirror `price-check.mjs` conventions (see price-check.mjs.md):

- **CLI:** `npm run photo-score -- [--dry-run] [--limit N] [--watch <uuid>] [--model <id>] [--no-ai] [--force]`. Reject unrecognized args with a did-you-mean (agents.md foot-gun rule). `--no-ai` = Layer 1 + HTML report only (free).
- **Safety:** `--dry-run` prints what it would score/write; always dry-run a small `--limit` before a paid run.
- **Logging:** wrap with `scripts/lib/agent-run.mjs` → `agent_runs` (duration, cost in microdollars, items, tokens) + per-image `agent_run_items`. Best-effort, never breaks real work; honor `AGENT_RUN_DISABLED`.
- **Auth:** `ANTHROPIC_API_KEY` + Supabase service role from `.env.local`.
- **Idempotent:** skip content_hashes already scored unless `--force` (fill-only-NULL pattern). Re-runs bill only new frames.
- **Cost printout** at end, consistent with the fleet.
- **Runs locally** (needs `\WatchImages`); `scripts/photo-score.cmd` double-click wrapper.

---

## 9. Cost estimate

- **Layer 1:** $0 — and stack collapse typically removes the *majority* of frames in a stacking session (30 sources → 1 composite) before any AI sees them.
- **Track A (Haiku):** fractions of a cent per frame; a session's standard shots ≈ pennies.
- **Track B (Sonnet):** ~1–2¢ per rubric image + one comparative call per class — far under spec-fetch's $0.05–0.15 (no web search). A few hundred creative survivors ≈ a few dollars, one time; then only new frames bill. $100/mo Console cap remains the backstop.

---

## 10. Review & UI surfacing

- **Local HTML culling report (Phase 1 — replaces the in-app culling grid from v1.0):** the web app *cannot display capture-folder images* (local files, no storage URLs — the v1.0 plan's gap). Instead the script writes a self-contained `_photo-report.html` into each watch's capture folder: frames sorted by composite, stack sequences collapsed (expandable), duplicates grouped, CV/AI badges, the coverage matrix + reshoot list at top, `<img>` via relative paths so full-res originals are one click away in the browser/Explorer. Zero infrastructure, works offline.
- **In-app (uploaded photos only, later phase):** score badges + "suggested cover" chip on the watch edit page's gallery; human confirms `is_cover` (never auto-applied). Coverage/reshoot status *can* surface in-app immediately (it's DB data, no local images needed to *list* missing shots) — a natural future "Attention Needed" section: *"3 watches missing a caseback shot."*
- **Agent Execution Review (`/reports/agents`):** run rows + audit trail flow in automatically via `agent_runs`.

---

## 11. Phased rollout

1. **Phase 1 — CV only, free.** Migration 00040 + `photo-score.mjs --no-ai`: CR3 preview extraction (+ the full-res preview verification), stack-sequence collapse, ROI sharpness/brightness/glare, dup clustering, score write-back, and the local HTML report. Real value at $0; validates the pixel pipeline on actual captures before the first paid token.
2. **Phase 2 — Track A.** Shot-card evaluator (Haiku), coverage matrix + reshoot list in the report and DB. Cheap, objective, immediately workflow-useful.
3. **Phase 3 — Track B.** Rubric pass + comparative hero ranking (Sonnet), composite scores, cover nominee. Dry-run → small `--limit` → full.
4. **Phase 4 — Polish.** Score-at-upload for `watch_photos`, in-app badges + cover suggestion, Attention Needed coverage chips, card list promoted to a config table if it needs per-user editing. **Inspiration-to-card tagging:** let Inspiration Gallery images (00039) be tagged to a shot card — "this is the caseback treatment I'm chasing" — so each card carries its own reference board; surfaces in the lab workflow next to the card's pass criteria (agreed 2026-08-09).

---

## 12. Open decisions

Resolved in v1.1: ~~score store~~ (Option B), ~~primary pool~~ (capture-folder first), ~~public visibility~~ (owner-only), ~~culling review surface~~ (local HTML report), ~~hero mechanism~~ (comparative ranking).

Still open:

- **The shot-card list** — confirm/extend the four-card starter set (§3.6) and each card's pass criteria wording. This is the user's call; it encodes their standard session.
- **Composite weights & critical-gate thresholds** — start from documented defaults, tune against a labeled handful of real watches.
- **CR3 preview resolution** — verify on one real R10 file at build time (fallback: LibRaw).
- **Stacking workflow** — staying with in-camera Depth Composite for now; if the lab moves to Helicon/Zerene, only the sequence-representative lookup changes (§3.7 contingency).

---

*Companion reference: VacationRecap `docs/Image-Quality-Evaluation.md` (the technique source). v1.0 of this plan was authored in that project; v1.1 is the TenTenLoupe-side joint review.*

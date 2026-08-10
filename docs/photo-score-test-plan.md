# Photo-Score Test Plan — first full exercise on the lab machine

**Goal:** exercise every Phase 1 + Phase 2 behavior of `npm run photo-score`
against real R10 captures, and grade the grader — so we know which thresholds
and card specs to tune before Phase 3. Companion docs:
[photo-scoring-agent.md](photo-scoring-agent.md) (design),
[agents.md](agents.md) §7 (operator reference), [photo-lab.md](photo-lab.md)
(capture technique).

**Budget:** shooting ~60–90 min for two watches; agent runs are minutes.
Model spend ≈ $0.05–0.10 total (Haiku, ~$0.0015 per graded frame).

---

## 0. One-time setup (lab machine)

1. `git pull` and `npm install` (new dependency: `exiftool-vendored`, ships
   its own ExifTool binary — no separate install).
2. Confirm `.env.local` has `NEXT_PUBLIC_SUPABASE_URL`,
   `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`.
3. **Set the WatchImages parent in Config → Settings**
   (`profiles.watch_images_path`) — it is currently NULL in the DB, so every
   script run would otherwise need `--dir`. Then:

   ```bash
   npm run sync-watch-folders
   ```

   to create any missing `<Brand> <Model> [id8]` folders.
4. Pick **two test watches** with different surface characters — ideally one
   dressy/polished (reflection torture test) and one sport/matte. Verify on
   their edit pages: brand, model, and **reference number** filled (all three
   feed the grader's grounding text).

## 1. What to shoot

Point EOS Utility's PC destination at watch #1's folder (per photo-lab.md),
shoot on the C1 recipe, and capture the sets below. **Keep a paper/notes
ground-truth list as you go** — for each frame, what it is and whether YOU
would pass it. That list is what the evaluation section compares against.
Don't rename or sort files; the agent expects the folder exactly as EOS
Utility leaves it.

### Set A — standard shots, with deliberate failures (Track A)

| # | Shot | Intent | Expected verdict |
|---|---|---|---|
| A1 | Overhead dial, by the book (sharp, controlled highlights) | The keeper | `overhead_dial` PASS → coverage keeper |
| A2 | Overhead dial, focus nudged clearly off the dial | Named-defect test | `overhead_dial` FAIL, defect ≈ "dial out of focus" |
| A3 | Overhead dial, pull the diffusion so a highlight blows across the dial | Glare gate test | `overhead_dial` FAIL + CV `glare` flag |
| A4 | Caseback, sharp and centered | Coverage | `caseback` PASS |
| A5 | Crown side, crown in focus | Coverage | `crown_side` PASS |
| A6 | Low lug angle | Coverage | `lug_low` PASS |

On **watch #2, deliberately skip one card entirely** (e.g. never shoot the
caseback) → its report must show that card on the RESHOOT list with
"no matching frame".

### Set B — focus-stack collapse

1. One in-camera Focus Bracketing run per photo-lab.md defaults (30 shots,
   increment 3, Depth Composite ON) on an angled hero composition.
   → Expect: ~30 CR3 sources + 1 composite JPG collapse to **one unit**;
   sources never scored, never cull-suggested, never sent to the model;
   the composite gets graded with the "focus-stacked composite" grounding.
2. Optional: a second bracket run with **Depth Composite OFF** → expect the
   report to flag the sequence "unstacked — needs composite".

### Set C — duplicates and cull candidates

1. 3–4 near-identical frames of one composition (re-trigger AF between shots,
   tiny reframes) → expect one dup group; the sharpest marked `best`, the
   rest cull-suggested; **only the best is card-graded** (check the count).
2. One frame ~2 stops underexposed and one clearly soft → expect `exposure`
   and `soft` CV flags and a place in Cull suggestions.

### Set D — creative routing + exports

1. 2–3 artistic shots (props, dramatic angle, wrist shot) → expect
   `creative` routing — no pass/fail, no reshoot pressure.
2. Develop one frame in Luminar Neo and export a JPEG into the same folder
   with a non-Canon name (e.g. `sbga211-hero-edit.jpg`) → expect
   `kind: export` in the printout and report.
3. If the body is ever set to HEIF: note whether files are skipped with a
   "cannot decode" warning — known limitation, log it, don't fight it.

## 2. Execution ladder (cheapest first — fleet house rules)

```bash
npm run photo-score -- --dry-run --no-ai --watch <watch1-uuid>
```
**$0.** Verify: file count matches reality; kinds correct (cr3/jpeg/export);
stack sequence detected with the right source count; dup groups match your
ground truth; sharpness ordering sane; NO "embedded preview" resolution
warning appears.

```bash
npm run photo-score -- --dry-run --watch <watch1-uuid>
```
**Pennies.** Verify each frame's `card:` verdict in the printout against your
ground-truth list. Nothing is written yet.

```bash
npm run photo-score -- --watch <watch1-uuid>
```
**Live.** Writes DB rows, `_previews/`, and `_photo-report.html`. Repeat for
watch #2, then finish with a plain `npm run photo-score` (all folders — only
new frames cost anything).

**Idempotency check (important):** immediately rerun the live command for
watch #1. Expect "N reused, 0 newly scored, 0 card-graded" and ≈ $0.0000.
Then optionally `--force` to confirm re-grading works and overwrites verdicts.

## 3. How to evaluate

Open `_photo-report.html` in the watch folder (double-click; thumbnails in
`_previews/`, click any image for the original).

**Correctness checklist**

- [ ] Coverage matrix: every card's PASS/RESHOOT matches your ground truth;
      the keeper is the frame you'd have picked (or defensibly close).
- [ ] A2/A3 failures carry *useful named defects* — the defect text should
      tell you what to fix at the bench without opening the file.
- [ ] Watch #2's skipped card is on the reshoot list.
- [ ] Stack section: one collapsed unit, expandable source list, correct
      composite; optional run 2 flagged unstacked.
- [ ] Cull suggestions: would you actually cull them? Count false
      accusations (good frames flagged) and misses (junk not flagged).
- [ ] Creative shots routed `creative`, not failed.
- [ ] In-app: `/reports/agents` shows the runs with tokens + cost; row counts
      in `watch_image_scores` equal file counts per watch.

**Grade the grader** — record every disagreement in three buckets:

1. **False PASS** (grader passed what you'd reshoot) — watch especially for
   exposure leniency: in fixture testing Haiku passed a severely underexposed
   dial. The CV `exposure`/`soft` flags are the backstop; if false passes
   recur, we tighten the card specs' wording or add a CV gate before grading.
2. **False FAIL / wrong card** — usually fixed by rewording the `SHOT_CARDS`
   spec in `scripts/photo-score.mjs` (it's a constant; edit and `--force`
   re-grade one watch to A/B).
3. **CV threshold misses** — glare flag at 10% ROI, weak-sharpness at the
   bottom 20th percentile, exposure bounds 40/220 are all starting guesses
   (constants at the top of the script). Note which fired wrongly.

## 4. Closing the loop

Bring the results back to a Claude Code session as a conclusions summary
(the photo-lab.md maintenance workflow):

- disagreement list + which bucket,
- any threshold/spec changes you want,
- whether the four-card list is right (add/remove/rename cards — e.g. a
  clasp shot? a macro dial detail card?),
- anything that annoyed you in the report layout.

That feedback directly shapes Phase 3 (Track B rubric + comparative hero
ranking), which builds on the same survivors this test produces.

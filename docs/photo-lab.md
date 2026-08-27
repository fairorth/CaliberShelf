# Watch Photography Lab

**This is the living, single source of truth for the TenTenLoupe photo lab.**

How this document is maintained:

- Think and explore anywhere — the claude.ai chat surface is great for working
  through camera/lighting questions. Optionally upload this file there so that
  conversation starts from current truth.
- End a thinking session by asking for a **conclusions summary** (decisions
  made, settings validated, lab-verified findings) and hand that summary to
  Claude Code, which merges it here surgically and commits. Chat never
  rewrites this file wholesale — one writer, git history as the changelog.
- The four illustrated v1.0 Word guides in `docs/Watch Photography/` are
  **archived originals** (frozen; mostly static R10/EOS Utility mechanics with
  figures). Read them for depth and pictures; never update them.

**Scope.** This file is the craft: camera, lens, light, EOS Utility. Two
companions cover the rest, and each is the single source of truth for its half:

- [`photo-lab-app.md`](photo-lab-app.md) — the **software**: the Coverage /
  Session / Review screens, the scripts, the data model, and the current
  known gaps.
- [`photo-lab-game-plan.md`](photo-lab-game-plan.md) — the **tutorial and
  campaign plan** for shooting the whole collection.

## Hardware

| Component | Notes |
|---|---|
| Canon EOS R10 (APS-C) | C1 = watch-lab preset (gold master, Auto update OFF so experiments don't rewrite it) · C2 = RF28mm walk-around preset |
| Canon RF 100mm F2.8 L Macro IS USM | The lab optic. AF on, focus limiter FULL, IS OFF on tripod, SA ring neutral + locked |
| Overhead tripod + Windows tether station | EOS Utility 3.20.21.1 over USB-C. Golden rule: the body holds a known-good C1; EOS Utility is the day-to-day control surface — touching the mounted camera is the exception |
| Luminar Neo | RAW development / finishing |

## The C1 recipe

M mode · ISO 100 · f/8 · shutter to taste against the histogram · fixed white
balance · **RAW (.CR3)** (C-RAW only if storage ever hurts — storage is cheaper
than re-staging a watch) · One-Shot AF, 1-point, subject
detection/tracking/eye/Preview-AF all OFF · back-button AF (shutter half-press =
metering only; AF-ON = metering + AF) · electronic first curtain · single
drive · **Lens operation when AF unavailable = Continue focus search** —
lab-verified fix for the RF100mm silently refusing AF after a large focus jump
(Stop focus search may decline to drive the lens when badly defocused).

To improve the recipe: change it in a normal creative mode, verify, then
re-register C1 (MENU → Set-up → Custom shooting mode → Register settings).

**Overhead geometry:** sensor plane ~18–20″ from the watch · dial parallel to
sensor for flat catalog shots · watch fills ~70–80% of frame, leaving margin
for straightening and depth-composite cropping. The RF100mm's minimum focus
distance is ~10.2″ sensor-to-subject; full-watch shots want much more.

**Working distance table** (100mm on APS-C, circle of confusion 0.019 mm,
sensor plane to watch). Computed 2026-08-22; it corrects the old "16–20″"
figure, which does not frame a whole watch at its near end:

| Distance | Frame width | DoF @ f/8 | @ f/11 | Use |
|---|---|---|---|---|
| 16″ | 29 mm | 0.9 mm | 1.2 mm | Macro detail only — a 40 mm watch does not fit |
| 18″ | 47 mm | 2.0 mm | 2.7 mm | Flat dial-on, tight (40 mm head = 85% of width) |
| 20″ | 60 mm | 3.1 mm | 4.2 mm | Flat dial-on, comfortable (67%) |
| 24″ | 86 mm | 5.6 mm | 7.8 mm | Profile, caseback |
| 28″ | 109 mm | 8.8 mm | 12.1 mm | Laid-down hero, tight |
| 32″ | 133 mm | 12.6 mm | 17.3 mm | **Laid-down hero, standard** |
| 36″ | 156 mm | 17.0 mm | 23.4 mm | Hero with a long strap sweep |

Two consequences worth internalising: depth of field at the dial-shot distance
is about **two millimetres** against a watch head roughly twelve millimetres
thick — which is why anything angled must be stacked, and why a couple of
degrees of tilt costs you one side of the dial. And the hero shot is taken from
**much further back** than the dial shot, where the depth-of-field problem
largely solves itself.

## EOS Utility operations (the parts that matter)

- **Two rectangles:** inner square = AF point (toggle with *AF Point Disp* —
  must be ON for remote AF), outer frame = magnification frame only.
- **Double-click focus method:** double-click *inside* the inner AF point →
  runs One-Shot AF (green = success). Double-click *elsewhere* → moves the
  AF/magnification location there and opens 5× (does not focus yet); a second
  double-click on the relocated point runs AF.
- **Fine focus nudges** (keyboard): large `I`/`O` · medium `K`/`L` · small
  `,`/`.` (closer/farther). Lab-verified on this R10 + 3.20 combo: the small
  nudges work while the capture window stays in AF — fastest flow is
  **AF → 10× → tiny nudge → shoot**.
- **AF point colors:** green = One-Shot success, blue = Servo success,
  orange = failure. Read color in the context of the AF mode.
- **Destination:** record to **PC + card** (PC copy for immediate inspection,
  card as backup). Verify once per session with a test frame.

## Single-shot workflow

Clean everything (watch, crystal, background — dust now beats retouching
later) → compose with margin → confirm C1 + lens switches → set shutter until
polished-steel highlights are controlled (histogram as guardrail, not target) →
AF point on a high-contrast dial feature → double-click → green → 10× inspect,
nudge if needed → back to 1× → remote release → inspect at 100% (dial text,
marker edges, crystal dust, bezel reflections, clipped highlights).

## Focus stacking

For angled/hero shots. Flat dial-on needs it less — the dial sits in one plane —
but note from the distance table that f/8 at 18" buys about 2 mm, and the hands
ride 2-4 mm above the dial, so a five-frame stack is cheap insurance whenever
you want hand tips AND dial printing crisp. In-camera Focus
Bracketing starting point: **30 shots · increment 3 · exposure smoothing ON ·
Depth Composite ON (while learning) · crop ON**. Start focus on the *nearest*
plane that must be sharp; the camera walks focus farther. Trigger once and
**touch nothing** until the sequence completes. Inspect the composite plus
first/middle/last source frames — stack ends too early → more shots; soft gaps
→ smaller increment.

RAW sources are retained; the in-camera composite is **JPEG/HEIF only** (Canon
never composites to RAW). No need to capture RAW+JPEG for stacking.

## Capture files → the watch folder

The EOS Utility PC destination is the per-watch folder under the
`\WatchImages` parent (`<Brand> <Model> [<8-char-watch-id>]`, created by
`npm run sync-watch-folders`; parent path in Config → Settings /
`profiles.watch_images_path`, migration 00035). **Point the destination at the
session watch's folder at the start of each session** — the folder-per-watch
routing is the TenTenLoupe linkage.

A session folder typically contains: `.CR3` frames (singles + stack sources),
`.JPG`/`.HEIF` in-camera composites (stacked shots), and finished Luminar Neo
exports. Cover-photo output target: **2000px-long-edge JPEG at quality 85** —
which is exactly what Review's Accept produces from whatever you point it at.

(The old note here paired this target with "the dial focal-point framing editor
on the watch edit page". That editor is gone: Phase 9 stopped writing
`dial_focal_x/y` and `dial_zoom`, and every photo surface is now
`object-contain` with no crop or focal point anywhere.)

## The laid-down hero (the cover shot)

Landscape orientation, watch laid on its caseback, camera 20–30° off vertical
at 30–32″, strap or bracelet arranged in a lazy S that fills the frame width.
Head at roughly one third in, crown side toward camera, hands at 10:10, watch
and strap filling 75–85% of the width.

This is the shot the app is built to reward: the watch page hero renders
`object-contain` at a fixed 460 px height (a 3:2 frame fills 690 × 460), and
the home Light Table picks its landing frame by **widest aspect ratio**, with
the hero angle only breaking ties. When image dimensions were backfilled the
collection measured 114 portrait, 31 square, 20 landscape, 4 wide — so almost
every watch currently lands on a portrait frame in a layout that wants a wide
one. Full technique in
[`photo-lab-game-plan.md`](photo-lab-game-plan.md) Part 4.

## Lighting principles (the current frontier)

Watch photography is the controlled shaping of reflections: polished steel is a
mirror, brushed steel a directional texture, sapphire a reflector, sunburst
dials change with tiny light-angle moves.

- Large diffuse source above the watch → broad clean gradients.
- Small white cards → controlled highlights on dark case edges.
- Black cards (negative fill) → shape and separation on polished surfaces.
- Change ONE variable at a time and record it; two inches can matter.
- Keep exposure and WB fixed while comparing lighting setups.

## Troubleshooting quick table

| Symptom | Action |
|---|---|
| AF silently does nothing after a big distance change | Confirm *Continue focus search* |
| AF point orange/red | No focus achieved — higher-contrast edge, more light |
| Camera refocuses on its own after One-Shot | Preview AF is on; disable |
| Double-click only magnifies | AF Point Disp off, or click was outside the inner point |
| Composite edge artifacts | More framing margin, crop ON, smaller increment, or external stacking |
| Composite is JPEG despite RAW sources | Normal — in-camera composite is always JPEG/HEIF |

## Implications for the AI image-selection agent (now building — see photo-scoring-agent.md)

- **File formats:** sharp (our image library) cannot decode CR3. RESOLVED
  (v1.7.0): option (b) — `photo-score.mjs` extracts the embedded `JpgFromRaw`
  preview via ExifTool, verified full-resolution on a real R10 CR3. The lab
  workflow is untouched.
- **Sharpness semantics:** stacked composites are sharp everywhere by design;
  singles are sharp only at the focal plane. Scoring must not penalize
  intentional shallow-DoF singles against composites.
- **Angle classes** worth detecting: flat dial-on, angled/three-quarter hero,
  side profile, caseback/clasp, macro detail.

## Known gaps (log findings here as they're resolved)

- Fixed white balance has no concrete recipe yet (grey-card step or Kelvin value).
- No polarizer (CPL) guidance; glare control currently relies on diffusion/flags.
- Lighting recipes are principles-only so far — no documented setups per watch style.
- The C1 checklist is duplicated as `C1_CHECKLIST` in `session-view.tsx` so the
  Session screen can show it. **Change the recipe here, change it there too.**
- Software-side gaps (Track B unbuilt, no shot card for the hero ¾, no bulk
  angle tagging) are catalogued in
  [`photo-lab-app.md`](photo-lab-app.md) §7 — not here.

## Appendix: non-lab presets

C2 = RF28mm walk-around (Av · f/4 start · Auto ISO ceiling 6400 · min shutter
1/250 · Servo · whole-area AF · people/eye detection on · high-speed drive ·
RAW · same back-button mapping as C1). My Menu is organized as three tabs
(Watch Lab / Studio / Maintenance) — full item lists and registration steps in
the archived Deep Dive guide.

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

**Overhead geometry:** sensor plane ~16–20″ from the watch (18″ starting
point) · dial parallel to sensor for flat catalog shots · watch fills ~70–80%
of frame, leaving margin for straightening and depth-composite cropping. The
RF100mm's minimum focus distance is ~10.2″ sensor-to-subject; full-watch shots
want more.

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

For angled/hero shots (flat dial-on often doesn't need it). In-camera Focus
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
exports. Cover-photo output target: 2000px-long-edge JPEG (pairs with the dial
focal-point framing editor on the watch edit page).

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

## Appendix: non-lab presets

C2 = RF28mm walk-around (Av · f/4 start · Auto ISO ceiling 6400 · min shutter
1/250 · Servo · whole-area AF · people/eye detection on · high-speed drive ·
RAW · same back-button mapping as C1). My Menu is organized as three tabs
(Watch Lab / Studio / Maintenance) — full item lists and registration steps in
the archived Deep Dive guide.

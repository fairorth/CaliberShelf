# Watch Photography Lab

Distilled operating reference for the CaliberShelf photo lab, extracted from the
illustrated master guides in `docs/Watch Photography/` (Word documents, v1.0):

- **Canon_R_Macro_Watch_Photography_Deep_Dive** — the master manual (source of truth)
- **R10_Watch_Lab_Gold_Configuration** — C1/C2 preset card
- **Watch_Lab_Shooting_Checklist** — session checklist
- **EOS_Utility_3.20_Watch_Lab_Cheat_Sheet** — tether-control reference

This file is the summary the app and agents rely on. When the lab workflow
changes, update the master .docx first, then re-distill here.

## Hardware

| Component | Notes |
|---|---|
| Canon EOS R10 (APS-C) | C1 = watch lab preset (gold master, auto-update OFF) · C2 = RF28mm walk-around |
| Canon RF 100mm F2.8 L Macro IS USM | The lab optic. AF on, limiter FULL, IS OFF on tripod, SA ring neutral + locked |
| Overhead tripod + Windows tether station | EOS Utility 3.20.21.1, USB-C. Camera untouched once mounted — EOS Utility is the control surface |
| Luminar Neo | RAW development / finishing |

## The C1 recipe (summary)

M mode · ISO 100 · f/8 · shutter to taste against the histogram · fixed white
balance · **RAW (.CR3)** · One-Shot AF, 1-point, all subject
detection/tracking/eye/Preview-AF OFF · back-button AF (shutter = metering
only) · electronic first curtain · **Lens operation when AF unavailable =
Continue focus search** (prevents silent AF stalls after large focus jumps —
lab-verified fix).

Overhead geometry: sensor plane ~16–20″ from the watch, dial parallel for
catalog shots, watch filling ~70–80% of frame with margin for cropping.

## Focus stacking

In-camera Focus Bracketing starting point: **30 shots, increment 3, exposure
smoothing ON, Depth Composite ON, crop ON**. Start focus on the *nearest* plane
that must be sharp; camera walks focus farther. Output: RAW source frames are
retained; the in-camera composite is **JPEG/HEIF only** (Canon never composites
to RAW). Angled hero shots need stacking; flat dial-on shots often don't.

## Capture files → what lands in the watch folder

EOS Utility records to **PC + SD card** (verify at session start). The PC
destination is the per-watch folder under the `\WatchImages` parent
(`<Brand> <Model> [<8-char-watch-id>]`, created by
`npm run sync-watch-folders`, parent path in Config → Settings /
`profiles.watch_images_path`, migration 00035). **Point the EOS Utility
destination at the session watch's folder at the start of each session** — that
folder-per-watch routing is the app linkage.

A typical session folder therefore contains:

- `.CR3` RAW frames (singles + stack source frames)
- `.JPG`/`.HEIF` in-camera depth composites (stacked shots only)
- Finished exports from Luminar Neo (when produced)

## Implications for the AI image-selection agent (planned)

- **File formats**: sharp (our image library) cannot decode CR3. The agent must
  either (a) score only JPEG/HEIF files (composites + exports), (b) extract the
  embedded JPEG preview from CR3s, or (c) the lab switches to RAW+JPEG capture
  during sessions. Open decision — (b) keeps the lab workflow untouched.
- **Sharpness semantics**: stacked composites are sharp *everywhere* by design;
  single frames are sharp only at the focal plane. Sharpness scoring must not
  penalize intentional shallow-DoF singles against composites.
- **Angle classes** worth detecting: flat dial-on, angled/three-quarter hero,
  side profile, caseback/clasp, macro detail.
- Cover-photo output target: 2000px-long-edge JPEG (pairs with the dial
  focal-point framing editor).

## Known gaps (candidates for guide v1.1)

- Per-watch folder routing habit is not yet in the master guide's tether section.
- Fixed white balance has no concrete recipe (grey-card step or Kelvin value).
- Lighting section is intentionally thin — flagged in the guide as the next
  frontier (diffusion, white/black cards, one-variable-at-a-time).
- No polarizer (CPL) guidance; glare control currently relies on diffusion/flags.

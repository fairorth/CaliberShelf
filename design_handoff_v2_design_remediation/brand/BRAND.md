# TenTenLoupe — brand spec

Locked 2026-08-12. Supersedes all CaliberShelf branding. Domain: tentenloupe.com

## Name

**TenTenLoupe**, one word, camel-cased in code and prose. Displayed as **Ten:Ten LOUPE** in the
lockup only — never write "Ten:Ten Loupe" in body copy, alt text, or page titles.

- Product / app: TenTenLoupe
- Service line: TenTenLoupe Studio
- Never: CaliberShelf, Caliber Shelf, TTL, Ten Ten Loupe

## Wordmark (lockup 3A)

| Part | Spec |
|---|---|
| `Ten` `Ten` | Fraunces 600, letter-spacing -0.02em |
| `:` | Fraunces 600, brass `#c9a25e` — the ONLY brass in the wordmark |
| rule | 1px, horizontal gradient transparent → brass 0.75 → transparent |
| `LOUPE` | JetBrains Mono 500, letter-spacing 0.46em, brass, optically centred (pad-left 0.46em) |

Horizontal (mark left, type right, 30px gap) is primary. Stacked is for card, watermark, print.

## Mark

Six-blade iris with a minimalist dial in the aperture.

Geometry is identical in both grounds; only the fills differ.

- **Blades** — 6 wedges from 0°, r=47, alternating heavy / light
- **Barrel ring** — 2px at 100px scale, r=48
- **Aperture** — hexagon, circumradius 36, vertices at 0/60/120/180/240/300° (flat top, points
  left and right), filled with the surface colour
- **Dial** — double index at 12, single indices at 3, 6, 9
- **Hands** — hour to 10 (length 22, width 2.4), minute to 2 (length 29, width 2), round caps.
  The minute hand is always the longer one.
- **Pinion** — brass `#c9a25e`, r=3.4, in both grounds

### Fills by ground

| Part | Dark ground | Light ground |
|---|---|---|
| blade (heavy) | `rgba(201,162,94,0.72)` | `#8a6a2f` |
| blade (light) | `rgba(201,162,94,0.28)` | `#b08c46` |
| barrel ring | `#c9a25e` | `#8a6a2f` |
| aperture | `#101a26` | the page surface colour |
| indices + hands | ivory `#f4f1ea` | navy `#14202e` |

**Do not use the dark alpha values on a light surface.** Brass at 28% alpha over a light ground
is very nearly white and 72% is barely tinted, so the six-blade structure disappears and the
mark reads as a grey disc with a white centre — no brand recognition at rail size. The light
ground needs *opaque* blades in the deeper brass range, which is why the two tones above are
solid colours rather than alphas. Corrected 2026-08-12 after the round-2 brand review; the
original spec gave only the dark values and the light variants inherited them by mistake.

### Size rule

Below **26px** the indices do not resolve — use the `-small` files (blades, hands, pinion only).
At 26px and above use the full mark.

### Single colour

For foil, emboss and laser engraving use `mark-mono-brass.svg` — solid `#c9a25e` / `#8a6a2f`
blades. Never reproduce the two-tone alpha conic in one-colour processes.

## Colour

| Token | Hex | Use |
|---|---|---|
| brass | `#c9a25e` | action, the colon, the ring — on dark only |
| brass-deep | `#8a6a2f` | brass on light surfaces: fills, text, the colon, the ring |
| brass-facet | `#b08c46` | the lighter of the two blade tones on light |
| navy | `#14202e` | brand ground |
| dial | `#101a26` | aperture interior on dark |
| ivory | `#f4f1ea` | hands, indices, type on dark |

## Files

| File | Use |
|---|---|
| `logo-horizontal-dark.svg` / `-light.svg` | primary lockup |
| `logo-stacked-dark.svg` / `-light.svg` | card, watermark, print |
| `mark-dark.svg` / `mark-light.svg` | mark alone, ≥26px |
| `mark-small-dark.svg` / `-light.svg` | mark alone, <26px |
| `mark-mono-brass.svg` | one-colour reproduction |
| `icon-512.png`, `icon-192.png` | PWA manifest |
| `apple-touch-icon-180.png` | iOS home screen |
| `favicon-32.png`, `favicon-16.png` | browser tab |
| `mark-1024.png` | transparent master for resizing |

Lockup SVGs use live text — Fraunces and JetBrains Mono must be loaded, or the text renders in
the fallback serif/mono. For contexts without webfonts, use a PNG of the mark plus HTML text.

## Clear space and minimum sizes

Clear space on all sides = the height of the `T` in Ten. Minimum lockup width 140px; minimum
mark 16px. Never recolour the mark, rotate it, change the hand positions, or place the lockup on
a photograph without a scrim.

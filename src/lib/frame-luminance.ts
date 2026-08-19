// The bloom scrim's strength, derived from how bright the photograph itself is
// (design_handoff_v4 §11 Part 2).
//
// Phase 7 specified a fixed `rgba(0,0,0,0.52)` radial scrim over the bloom.
// That was designed against a watch shot on a dark desk. Most watch photography
// is shot on white or neutral seamless, which blurs to grey and then gets
// darkened to charcoal by a fixed scrim — so a bright photograph ends up in a
// heavy dark vignette, and the room darkens the photo instead of the photo
// lighting the room. It reads as a hole punched in the page.
//
// THE GUARDRAIL. What is derived here is ONE NUMBER: mean luminance. No hue is
// sampled, nothing is tinted, and brass remains the only accent in the app.
// This does not re-open Phase 7 §1.1's no-colour-extraction rule — a single
// scalar controlling how dark a black gradient is cannot leak a colour.

/** Neutral mid strength: what a frame gets before (or instead of) a sample. */
export const DEFAULT_SCRIM_STRENGTH = 0.25

/** The stage bloom's baseline opacity (Phase 8 §2.1, mock 4a). */
export const DEFAULT_BLOOM_OPACITY = 0.55

/**
 * Mean luminance (0–1) → opacity for the STAGE's bloom spill.
 *
 * §2.1 retires the stage scrim: with the box now matching the photograph there
 * is no large dark field left to correct, so luminance stops being a fix and
 * becomes "a small opacity adjustment". The direction inverts accordingly. The
 * old scrim darkened MORE for a dark photograph; the spill is a blurred copy
 * of the photograph itself, so a dark frame throws a dark halo onto a light
 * page and wants LESS of it, while a pale frame's spill is nearly invisible
 * and can afford a little more.
 *
 * Deliberately a narrow band around 0.55 — this is a nudge, not a correction.
 */
export function bloomOpacityForLuminance(luminance: number): number {
  const l = Math.min(1, Math.max(0, luminance))
  if (l <= 0.35) return 0.42
  if (l >= 0.75) return 0.58
  return 0.42 + (0.58 - 0.42) * ((l - 0.35) / 0.4)
}

/**
 * Mean luminance (0–1) → scrim strength (0–1), piecewise linear through the
 * three anchors Part 2 names: bright (`L > 0.75`) → 0.02–0.13, mid → 0.25,
 * dark (`L < 0.35`) → 0.52, which is Phase 7's original value.
 *
 * Pure, so the mapping can be reasoned about and tested without a canvas.
 */
export function scrimStrengthForLuminance(luminance: number): number {
  const l = Math.min(1, Math.max(0, luminance))
  if (l <= 0.35) return 0.52
  if (l <= 0.55) return lerp(0.52, 0.25, (l - 0.35) / 0.2)
  if (l <= 0.75) return lerp(0.25, 0.13, (l - 0.55) / 0.2)
  return lerp(0.13, 0.02, (l - 0.75) / 0.25)
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/** Resolved samples, keyed by URL — a frame seen twice never decodes twice,
 *  and the stage and the glance overlay share one measurement. */
const cache = new Map<string, number>()
/** In-flight samples, so the stage and the overlay mounting together on the
 *  same frame issue one decode rather than two. */
const pending = new Map<string, Promise<number | null>>()

/** A previously measured luminance, if this URL has already been sampled. */
export function cachedLuminance(url: string): number | undefined {
  return cache.get(url)
}

/**
 * Mean luminance of a thumbnail, via an 8×8 canvas draw.
 *
 * ALWAYS the thumbnail (~192px), never the full-resolution frame: the whole
 * point is that the client does as little pixel work as possible, and the
 * browser's own downscale to 8×8 does the averaging for us. Rec.709 luma on
 * the sRGB values — weighting the channels is how luminance is defined, and is
 * not hue sampling; the three channels collapse to one number here and the
 * number is all that leaves this function.
 *
 * Resolves null when the sample cannot be taken — a cross-origin canvas taint,
 * a load failure, or no canvas at all — and the caller keeps the neutral mid
 * strength, which is still a large improvement on a fixed 0.52.
 *
 * The honest long-term home for this is the scoring pipeline, computed once at
 * upload time and stored beside the image score so the client never decodes
 * pixels at all. That needs a column, and Phase 8 adds no migrations. Note for
 * whoever does it: `watch_image_scores.brightness` is NOT this number — it is
 * the mean luma of the DIAL ROI, so on a white seamless it measures the watch
 * rather than the field and would swing the scrim the wrong way.
 */
export function sampleThumbLuminance(url: string): Promise<number | null> {
  const hit = cache.get(url)
  if (hit != null) return Promise.resolve(hit)
  const inFlight = pending.get(url)
  if (inFlight) return inFlight

  const run = new Promise<number | null>((resolve) => {
    if (typeof document === "undefined") {
      resolve(null)
      return
    }
    const img = new Image()
    // Required for getImageData: without it the canvas is tainted by the
    // cross-origin storage response and every read throws.
    img.crossOrigin = "anonymous"
    img.decoding = "async"
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas")
        canvas.width = 8
        canvas.height = 8
        const ctx = canvas.getContext("2d", { willReadFrequently: false })
        if (!ctx) {
          resolve(null)
          return
        }
        ctx.drawImage(img, 0, 0, 8, 8)
        const { data } = ctx.getImageData(0, 0, 8, 8)
        let sum = 0
        let counted = 0
        for (let i = 0; i < data.length; i += 4) {
          // Fully transparent pixels are padding, not photograph.
          if (data[i + 3] === 0) continue
          sum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]
          counted++
        }
        if (counted === 0) {
          resolve(null)
          return
        }
        const luminance = sum / counted / 255
        cache.set(url, luminance)
        resolve(luminance)
      } catch {
        // SecurityError from a tainted canvas, most likely. Not worth a retry.
        resolve(null)
      }
    }
    img.onerror = () => resolve(null)
    img.src = url
  }).finally(() => {
    pending.delete(url)
  })

  pending.set(url, run)
  return run
}

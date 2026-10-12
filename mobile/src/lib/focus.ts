import type { Frame } from "react-native-vision-camera"

/**
 * Live dial sharpness for the viewfinder (docs/iphone-app.md §8): the
 * variance of the Laplacian over the centre of the frame's brightness
 * channel — the same idea as the Photo Lab scorer's dial-ROI sharpness, run
 * on each preview frame instead of after the shoot.
 *
 * A sharp dial has crisp edges (indices, hands, print), so neighbouring
 * pixels differ a lot and the Laplacian swings widely; a soft one is smooth
 * and the variance collapses. It is RELATIVE: the number depends on the dial
 * and the light, so the threshold below is a first guess to calibrate on the
 * device — which is why the trial build shows the raw number.
 */

/**
 * The ring has a dead band between its two thresholds so a reading that
 * hovers near the line doesn't make it flicker: it turns WHITE (sharp) at
 * `sharpAt` or above, and only turns AMBER (soft) again below `softBelow`.
 * Both are camera settings (More → Camera, lib/camera-settings.ts).
 *
 * Calibrated on Marc's iPhone 17 Pro Max (2026-10-12): a sharp dial reads
 * ~4,000–7,000, a blurred one ~40. The iPhone's autofocus doesn't slide
 * between them — it hunts (~40) and then SNAPS into focus (thousands), so the
 * ring is really a "focus landed on the dial" light. The default line
 * (600 / 300) sits in the low hundreds, leaving headroom for dark dials and
 * dim light. (The first guess, 60/50, was below even the blurred reading.)
 */
export type FocusState = "unknown" | "sharp" | "soft"

export interface FocusThresholds {
  sharpAt: number
  softBelow: number
}

/** The ring's next state for a new reading (hysteresis between the two thresholds). */
export function nextFocusState(prev: FocusState, value: number, t: FocusThresholds): FocusState {
  if (value >= t.sharpAt) return "sharp"
  if (value < t.softBelow) return "soft"
  // In the dead band: keep what it was, so it doesn't flicker; a first
  // reading in the band counts as soft until it clearly clears sharpAt.
  return prev === "unknown" ? "soft" : prev
}

/** The analysed centre square, as a share of the shorter frame edge — about
 *  the dial guide's size. */
const ROI_SHARE = 0.4
/** Sample every Nth pixel: ~10k samples is plenty and costs ~nothing. */
const STEP = 2

/**
 * Runs on the camera's frame thread (a worklet). Expects a planar YUV frame
 * (`pixelFormat: 'yuv'`), whose first plane is 8-bit luma. Returns null when
 * the frame isn't readable that way.
 */
export function centreSharpness(frame: Frame): number | null {
  "worklet"
  if (!frame.isValid || !frame.isPlanar) return null
  const planes = frame.getPlanes()
  if (planes.length === 0) return null
  const luma = planes[0]
  const w = luma.width
  const h = luma.height
  const stride = luma.bytesPerRow
  const px = new Uint8Array(luma.getPixelBuffer())

  const size = Math.floor(Math.min(w, h) * ROI_SHARE)
  const x0 = Math.floor((w - size) / 2)
  const y0 = Math.floor((h - size) / 2)

  let sum = 0
  let sumSq = 0
  let n = 0
  for (let y = y0 + STEP; y < y0 + size - STEP; y += STEP) {
    const row = y * stride
    for (let x = x0 + STEP; x < x0 + size - STEP; x += STEP) {
      const i = row + x
      const lap =
        4 * px[i] - px[i - STEP] - px[i + STEP] - px[i - STEP * stride] - px[i + STEP * stride]
      sum += lap
      sumSq += lap * lap
      n++
    }
  }
  if (n === 0) return null
  const mean = sum / n
  return sumSq / n - mean * mean
}

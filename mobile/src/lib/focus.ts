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
 * The ring's thresholds, with a dead band between them so a reading that
 * hovers near the line doesn't make the ring flicker: it turns WHITE (sharp)
 * at SHARP_AT or above, and only turns AMBER (soft) again below SOFT_BELOW.
 * First guesses — calibrate on real dials and change them here.
 */
export const SHARP_AT = 60
export const SOFT_BELOW = 50

export type FocusState = "unknown" | "sharp" | "soft"

/** The ring's next state for a new reading (hysteresis between the two thresholds). */
export function nextFocusState(prev: FocusState, value: number): FocusState {
  if (value >= SHARP_AT) return "sharp"
  if (value < SOFT_BELOW) return "soft"
  // In the dead band: keep what it was, so it doesn't flicker; a first
  // reading in the band counts as soft until it clearly clears SHARP_AT.
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

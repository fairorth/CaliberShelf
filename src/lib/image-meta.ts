import "server-only"
import sharp from "sharp"

/** Pixel dimensions of a stored photograph, as it is meant to be seen. */
export interface ImageDimensions {
  width: number
  height: number
}

/**
 * Read an image's dimensions, with EXIF orientation already applied.
 *
 * The orientation part is the whole point. A camera that shoots portrait
 * usually writes a landscape pixel grid plus an orientation tag, so the raw
 * `width`/`height` describe the sensor rather than the photograph. Storing
 * those unswapped would tell the home stage to build a landscape box for a
 * portrait frame — the exact defect Phase 8 §2.1 exists to remove, arriving by
 * a different route.
 *
 * Orientations 5–8 are the 90°/270° cases, where the grid is transposed
 * relative to the intended view; 1–4 are upright or mirrored and need no swap.
 *
 * Returns null rather than throwing on anything unreadable. A photo with no
 * dimensions is a supported state everywhere downstream: it takes the 3:2
 * fallback box and sits out aspect comparison.
 */
export async function readImageDimensions(
  input: ArrayBuffer | Buffer
): Promise<ImageDimensions | null> {
  try {
    const buf = Buffer.isBuffer(input) ? input : Buffer.from(input)
    const meta = await sharp(buf).metadata()
    if (!meta.width || !meta.height) return null
    const transposed =
      typeof meta.orientation === "number" &&
      meta.orientation >= 5 &&
      meta.orientation <= 8
    return transposed
      ? { width: meta.height, height: meta.width }
      : { width: meta.width, height: meta.height }
  } catch {
    return null
  }
}

/** Column shape for a `watch_photos` insert — null when unreadable. */
export function dimensionColumns(dims: ImageDimensions | null): {
  image_width: number | null
  image_height: number | null
} {
  return {
    image_width: dims?.width ?? null,
    image_height: dims?.height ?? null,
  }
}

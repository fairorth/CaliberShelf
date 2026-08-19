/**
 * Frame aspect, shared by the server query and the client stage.
 *
 * Its own module on purpose: `queries/light-table.ts` imports the Supabase
 * server client, which reaches `next/headers`, so a client component importing
 * a *value* from it drags the whole server module into the browser bundle and
 * the build fails. Types are erased and travel fine; functions do not.
 */

/** The minimum a photo needs for its shape to be known (00048). */
export interface FrameDimensions {
  imageWidth: number | null
  imageHeight: number | null
}

/**
 * Width ÷ height, or **null when dimensions are not stored**.
 *
 * Null is the whole contract: a frame of unknown shape takes the 3:2 fallback
 * box and is excluded from widest-frame and nearest-1:1 comparison. It is never
 * assumed square — that would let an unmeasured frame win a comparison by
 * default and displace one whose aspect is actually known.
 */
export function frameAspect(f: FrameDimensions): number | null {
  if (!f.imageWidth || !f.imageHeight) return null
  return f.imageWidth / f.imageHeight
}

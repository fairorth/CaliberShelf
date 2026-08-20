/**
 * The film strip's surfaces, shared by the home stage and the watch page.
 *
 * Phase 9 §2.5: the same watch was speaking two photo languages — a 3:2 film
 * strip with angle labels on the home page, square tiles plus `+ ADD` on its
 * own page. One vocabulary, defined once, so they cannot drift apart again.
 *
 * The literal dark values are deliberate and scoped. The strip is a
 * photographic object the way the glance overlay is, the palette has no token
 * meaning "the inside of a film strip", and the film vocabulary must not
 * escape it — the page ground stays slate either side.
 */

export const STRIP_BASE = "oklch(0.28 0.010 245)"
export const STRIP_CELL = "oklch(0.22 0.008 245)"

/** Sprocket holes: punched in the PAGE background colour so they read as
 *  holes through the strip rather than pale bars painted on it. */
export const SPROCKET_STYLE = {
  borderRadius: 2,
  backgroundImage:
    "repeating-linear-gradient(90deg, var(--background) 0 11px, transparent 11px 24px)",
} as const

// Client-side display preferences stored in localStorage (per-device).

/** When set to "1", the Collection views show each watch's purchase price. */
export const SHOW_COST_KEY = "collection-show-cost"

/** sessionStorage (not localStorage): the collection's query string as the user
 *  last left it, so the watch view's "Collection" breadcrumb returns to that
 *  exact list rather than a bare one. Session-scoped on purpose — a new tab
 *  still opens the collection unfiltered. */
export const COLLECTION_RETURN_KEY = "collection-return-query"

/** Attention Needed: whether wish-list watches are included. Default true. */
export const ATTENTION_INCLUDE_WISHLIST_KEY = "attention-include-wishlist"

/** Home: show the Display Box instead of the rotating Light Table. */
export const DISPLAY_BOX_HOME_KEY = "home-show-display-box"

/** Home light table: which rotation set is showing. Values are RotationSetId
 *  strings ("all" | "wish" | "recent" | "guide:<id>"). Read after mount, never
 *  during SSR (same pattern as DISPLAY_BOX_HOME_KEY); an unknown or now-empty
 *  set falls back to "all" — validation lives with the component, which knows
 *  the live set list. */
export const HOME_ROTATION_SET_KEY = "home-rotation-set"

/** Read the saved rotation set id, or null when unset. Client-only. */
export function readHomeRotationSet(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(HOME_ROTATION_SET_KEY)
}

/** Home hero: how many seconds each featured watch stays up before swapping. */
export const HERO_DWELL_KEY = "home-hero-dwell-seconds"
export const DEFAULT_HERO_DWELL_SECONDS = 30
/** Durations offered in Settings (seconds). */
export const HERO_DWELL_OPTIONS = [10, 15, 20, 30, 45, 60, 90, 120] as const

/** Human label for a dwell duration, e.g. 30 → "30 seconds", 90 → "1.5 minutes". */
export function heroDwellLabel(seconds: number): string {
  if (seconds < 60) return `${seconds} seconds`
  const mins = seconds / 60
  return mins === 1 ? "1 minute" : `${mins} minutes`
}

/** Read the saved hero dwell (seconds), falling back to the default. Client-only. */
export function readHeroDwellSeconds(): number {
  if (typeof window === "undefined") return DEFAULT_HERO_DWELL_SECONDS
  const raw = Number(localStorage.getItem(HERO_DWELL_KEY))
  return (HERO_DWELL_OPTIONS as readonly number[]).includes(raw)
    ? raw
    : DEFAULT_HERO_DWELL_SECONDS
}

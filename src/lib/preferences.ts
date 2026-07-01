// Client-side display preferences stored in localStorage (per-device).

/** When set to "1", the Collection views show each watch's purchase price. */
export const SHOW_COST_KEY = "collection-show-cost"

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

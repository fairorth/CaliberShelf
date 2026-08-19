import type { PhotoAngle, ScoreAngleClass } from "@/lib/types/watch"

/** The five angle classes, in the coverage matrix's column order
 *  (docs/photo-lab.md · 04-screen-specs §3). */
export const PHOTO_ANGLES: PhotoAngle[] = [
  "flat",
  "hero",
  "profile",
  "caseback",
  "macro",
]

export const ANGLE_LABELS: Record<PhotoAngle, string> = {
  flat: "Flat dial-on",
  hero: "Hero ¾",
  profile: "Profile",
  caseback: "Caseback",
  macro: "Macro",
}

/** Short uppercase column headings for the coverage matrix and the home
 *  page's strip.
 *  One word each: the five columns share equal width, so a two-word heading
 *  wraps and drags the whole header row out of alignment. The long forms live
 *  in ANGLE_LABELS, which is what the Session and Review screens use.
 *  ASCII only — the ¾ that used to ride on HERO rendered as a stray glyph in
 *  mono at 11px (Phase 8 §10), and the strip's vocabulary is exactly
 *  FLAT · HERO · PROFILE · CASEBACK · MACRO. */
export const ANGLE_HEADINGS: Record<PhotoAngle, string> = {
  flat: "FLAT",
  hero: "HERO",
  profile: "PROFILE",
  caseback: "CASEBACK",
  macro: "MACRO",
}

/** Map photo-score.mjs's angle_class values onto the five photo angles. */
export function angleFromScoreClass(cls: ScoreAngleClass | null): PhotoAngle | null {
  switch (cls) {
    case "flat_dial_on":
      return "flat"
    case "angled_hero":
      return "hero"
    case "side_profile":
      return "profile"
    case "caseback_clasp":
      return "caseback"
    case "macro_detail":
      return "macro"
    default:
      return null
  }
}

/** Map a photo angle back to the scorer's angle_class vocabulary. */
export function scoreClassFromAngle(angle: PhotoAngle): ScoreAngleClass {
  switch (angle) {
    case "flat":
      return "flat_dial_on"
    case "hero":
      return "angled_hero"
    case "profile":
      return "side_profile"
    case "caseback":
      return "caseback_clasp"
    case "macro":
      return "macro_detail"
  }
}

/** Letter grade for a composite score in [0, 1] — display shorthand for the
 *  coverage matrix and Review (the number stays visible alongside). */
export function gradeForScore(score: number): string {
  if (score >= 0.92) return "A"
  if (score >= 0.85) return "A−"
  if (score >= 0.75) return "B+"
  if (score >= 0.65) return "B"
  if (score >= 0.55) return "B−"
  if (score >= 0.45) return "C"
  return "D"
}

/** Windows-safe folder name for a watch's capture folder — must match
 *  scripts/sync-watch-folders.mjs exactly (that script owns creation). */
export function watchFolderName(brandName: string, model: string, watchId: string): string {
  const base = `${brandName} ${model}`
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[ .]+$/, "")
  return `${base} [${watchId.slice(0, 8)}]`
}

/** Photos sort by sort_order when present, else display_order (00041). */
export function photoSortKey(p: { sort_order: number | null; display_order: number }): number {
  return p.sort_order ?? p.display_order
}

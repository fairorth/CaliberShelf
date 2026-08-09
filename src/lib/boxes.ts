// Watch storage boxes — user-configurable in Config → Boxes, stored per user
// on profiles.box_config as JSONB { count, descriptions }. Pure module (no
// I/O) so both server queries and the client config UI can share the helpers.
//
// Boxes are numbered Box1..BoxN; each may carry a short free-text description
// ("Luxury Tier", "Fun AliExpress Finds"). A watch's `box` column stores ONLY
// the numbered label ("Box3") as free text — descriptions are presentation,
// so renaming one never touches watch rows, and legacy/custom values keep
// working even if they fall outside the current numbered range.

export interface BoxConfig {
  count: number
  /** Short description per box label, e.g. { Box1: "Luxury Tier" }. */
  descriptions: Record<string, string>
}

export const DEFAULT_BOX_COUNT = 10
export const MIN_BOX_COUNT = 1
export const MAX_BOX_COUNT = 50
export const MAX_BOX_DESCRIPTION = 60

/** Coerce arbitrary stored/submitted data into a valid box count. */
export function normalizeBoxCount(raw: unknown): number {
  let n: number
  if (typeof raw === "number") {
    n = raw
  } else if (
    raw &&
    typeof raw === "object" &&
    typeof (raw as Record<string, unknown>).count === "number"
  ) {
    n = (raw as { count: number }).count
  } else {
    return DEFAULT_BOX_COUNT
  }
  if (!Number.isFinite(n)) return DEFAULT_BOX_COUNT
  n = Math.floor(n)
  if (n < MIN_BOX_COUNT) return MIN_BOX_COUNT
  if (n > MAX_BOX_COUNT) return MAX_BOX_COUNT
  return n
}

/** The ordered dropdown options for a given count: ["Box1", …, "BoxN"]. */
export function boxOptions(count: number): string[] {
  const n = normalizeBoxCount(count)
  return Array.from({ length: n }, (_, i) => `Box${i + 1}`)
}

/** Coerce stored/submitted data into a full BoxConfig (count + descriptions). */
export function normalizeBoxConfig(raw: unknown): BoxConfig {
  const count = normalizeBoxCount(raw)
  const descriptions: Record<string, string> = {}
  if (raw && typeof raw === "object") {
    const d = (raw as Record<string, unknown>).descriptions
    if (d && typeof d === "object" && !Array.isArray(d)) {
      for (const [key, value] of Object.entries(d as Record<string, unknown>)) {
        if (typeof value !== "string") continue
        const trimmed = value.trim().slice(0, MAX_BOX_DESCRIPTION)
        if (trimmed) descriptions[key] = trimmed
      }
    }
  }
  return { count, descriptions }
}

/** Display label for a box: "Box3 — Luxury Tier" when described, else "Box3". */
export function boxLabel(box: string, descriptions?: Record<string, string>): string {
  const d = descriptions?.[box]
  return d ? `${box} — ${d}` : box
}

// Watch storage boxes — user-configurable count in Config → Boxes, stored per
// user on profiles.box_config as JSONB { count }. Pure module (no I/O) so both
// server queries and the client config UI can share the types and helpers.
//
// Boxes are simply numbered Box1..BoxN. A watch's `box` column stores the chosen
// label as free text, so legacy or custom values keep working even if they fall
// outside the current numbered range.

export interface BoxConfig {
  count: number
}

export const DEFAULT_BOX_COUNT = 10
export const MIN_BOX_COUNT = 1
export const MAX_BOX_COUNT = 50

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

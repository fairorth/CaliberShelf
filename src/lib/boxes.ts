// Watch storage boxes — user-configurable in Config → Boxes, stored per user
// on profiles.box_config as JSONB { count, descriptions }. Pure module (no
// I/O) so both server queries and the client config UI can share the helpers.
//
// Boxes are numbered Box1..BoxN; each may carry a short free-text description
// ("Luxury Tier", "Fun AliExpress Finds"). A watch's `box` column stores ONLY
// the numbered label ("Box3") as free text — descriptions are presentation,
// so renaming one never touches watch rows, and legacy/custom values keep
// working even if they fall outside the current numbered range.

/** One watch moved by the last auto-fill, and where it came from. */
export interface AutoFillMove {
  watchId: string
  /** Brand + model at the time of the fill — a label, not a live join. */
  name: string
  /** The box it was in before, or null if it was not in one. */
  previousBox: string | null
}

/** What the last auto-fill did. Kept so the user can find the watches that
 *  were displaced: after filling a box you need to know which drawers the
 *  newly-assigned watches came OUT of, to physically move them. */
export interface AutoFillRecord {
  /** The box that was filled. */
  box: string
  /** ISO timestamp, stamped server-side by the action. */
  at: string
  /** Watches now in the box, with the box each came from. */
  moves: AutoFillMove[]
  /** Watches that were in the box before and are now unassigned. */
  removed: AutoFillMove[]
}

/** What an auto-fill WOULD do, computed without writing anything. */
export interface AutoFillPlan {
  box: string
  /** Picks not already in the box, each with where it currently sits and the
   *  engine's reason for choosing it. */
  incoming: Array<AutoFillMove & { reason: string }>
  /** In the box now, not picked — would be left unassigned. */
  outgoing: AutoFillMove[]
  /** In the box now and picked again — stays put. */
  staying: AutoFillMove[]
}

export interface BoxConfig {
  count: number
  /** Short description per box label, e.g. { Box1: "Luxury Tier" }. */
  descriptions: Record<string, string>
  /** Result of the most recent auto-fill, or null if none has run. Lives on
   *  the config rather than in its own table: it is a single per-user
   *  scratchpad, not history, and this needs no migration. */
  lastAutoFill: AutoFillRecord | null
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
  return { count, descriptions, lastAutoFill: normalizeAutoFill(raw) }
}

/** Coerce a stored auto-fill record, dropping anything malformed. Unknown or
 *  partial shapes resolve to null rather than throwing — this is a
 *  convenience readout, and it must never be able to break box config. */
function normalizeAutoFill(raw: unknown): AutoFillRecord | null {
  if (!raw || typeof raw !== "object") return null
  const value = (raw as Record<string, unknown>).lastAutoFill
  if (!value || typeof value !== "object") return null
  const rec = value as Record<string, unknown>
  if (typeof rec.box !== "string" || typeof rec.at !== "string") return null
  return {
    box: rec.box,
    at: rec.at,
    moves: normalizeMoves(rec.moves),
    removed: normalizeMoves(rec.removed),
  }
}

function normalizeMoves(raw: unknown): AutoFillMove[] {
  if (!Array.isArray(raw)) return []
  const out: AutoFillMove[] = []
  for (const item of raw) {
    if (!item || typeof item !== "object") continue
    const m = item as Record<string, unknown>
    if (typeof m.watchId !== "string" || typeof m.name !== "string") continue
    out.push({
      watchId: m.watchId,
      name: m.name,
      previousBox: typeof m.previousBox === "string" ? m.previousBox : null,
    })
  }
  return out
}

/** Display label for a box: "Box3 — Luxury Tier" when described, else "Box3". */
export function boxLabel(box: string, descriptions?: Record<string, string>): string {
  const d = descriptions?.[box]
  return d ? `${box} — ${d}` : box
}

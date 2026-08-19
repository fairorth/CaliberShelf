/**
 * One place that decides how a caliber is written (Phase 9 §2.1).
 *
 * The bug this exists to kill: `Miyota Miyota 90S5`. The edit form stores the
 * manufacturer and the caliber name as separate fields, but people naturally
 * type the maker into the caliber too — "Miyota 90S5" — so any site that
 * prepends the manufacturer unconditionally says it twice. It was reported on
 * the home stage and on the watch view page, and the same concatenation was
 * copy-pasted into five files.
 *
 * Pure and dependency-free so every one of those sites can share it: the home
 * query, the watch page, the collection tiles, the filter labels and the sort
 * keys all agree by construction rather than by five people remembering.
 */

/** The two fields any caller has, whatever its wider row type looks like. */
export interface CaliberFields {
  manufacturer: string | null
  caliber_name: string
}

/**
 * Lowercased, punctuation-flattened, with one trailing space — so a prefix
 * test lands on a whole word. Without the trailing space "Seiko" would match
 * "Seikosha 1234" and swallow a manufacturer that genuinely differs.
 */
function normalizeWords(value: string): string {
  return `${value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()} `
}

/**
 * "Miyota 90S5" — the manufacturer prepended only when the caliber name does
 * not already carry it.
 */
export function caliberLabel(movement: CaliberFields | null | undefined): string | null {
  if (!movement) return null
  const name = movement.caliber_name.trim()
  const maker = movement.manufacturer?.trim()
  if (!name) return maker || null
  const carriesMaker =
    !maker || normalizeWords(name).startsWith(normalizeWords(maker))
  return (carriesMaker ? name : `${maker} ${name}`).trim() || null
}

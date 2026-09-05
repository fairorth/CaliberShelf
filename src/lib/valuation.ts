// What a watch is worth right now — the ONE rule, applied at every surface.
//
// Three sources can offer a number (00046, 00053). Before v1.10.3 each screen
// picked differently: the watch page showed the agent's, the collection showed
// whichever row was newest, and the portfolio ignored manual rows entirely. One
// watch, three answers. This module is the arbiter; no screen may re-decide.
//
// The rule, in two clauses:
//
//   1. A `tier` row is a FALLBACK. It is the value only when the watch has no
//      agent and no manual row at all. It never competes on date — it is
//      re-stamped every time the tier percentages are edited, so a refresh
//      would otherwise silently overwrite a real observation with arithmetic.
//   2. Between `agent` and `manual`, the NEWEST wins; a tie goes to manual.
//      That is what makes "log a value" mean something (your $6,900 beats last
//      month's research) without freezing the watch (next month's price check
//      beats your $6,900).
//
// Pure — no I/O — so client components can import it without dragging in the
// server Supabase client, same reason ./queries/gain.ts lives apart.

import type { ValuationSource } from "@/lib/types/watch"

/** What each source is called on screen. Never invent a fourth wording. */
export const VALUATION_SOURCE_LABEL: Record<ValuationSource, string> = {
  agent: "Researched",
  tier: "Static",
  manual: "Logged",
}

/** One-line justification, for tooltips and report legends. */
export const VALUATION_SOURCE_HINT: Record<ValuationSource, string> = {
  agent: "Market research by the valuation agent, with sources.",
  manual: "A value you entered yourself.",
  tier: "Purchase price x the price tier's percentage — an assumption, not research.",
}

export interface ValuationRowLike {
  value_mid_cents: number
  valued_at: string
  source: ValuationSource
}

export interface CurrentValue {
  cents: number
  source: ValuationSource
  valuedAt: string
}

/** True for the sources that describe a specific watch rather than a band. */
function isObserved(source: ValuationSource): boolean {
  return source === "agent" || source === "manual"
}

/**
 * The current value from a watch's valuation rows, in any order, or null when
 * there are none. See the rule at the top of the file.
 */
export function pickCurrentValue<T extends ValuationRowLike>(
  rows: readonly T[]
): (CurrentValue & { row: T }) | null {
  let best: T | null = null
  for (const row of rows) {
    if (!isObserved(row.source)) continue
    if (
      best === null ||
      row.valued_at > best.valued_at ||
      // Same instant: the human's number is the one they meant to see.
      (row.valued_at === best.valued_at && row.source === "manual")
    ) {
      best = row
    }
  }
  if (best === null) best = rows.find((r) => r.source === "tier") ?? null
  if (best === null) return null
  return {
    cents: best.value_mid_cents,
    source: best.source,
    valuedAt: best.valued_at,
    row: best,
  }
}

/** Current value per watch id, for the list and total surfaces. */
export function currentValueByWatch<
  T extends ValuationRowLike & { watch_id: string },
>(rows: readonly T[]): Map<string, CurrentValue & { row: T }> {
  const byWatch = new Map<string, T[]>()
  for (const row of rows) {
    const list = byWatch.get(row.watch_id)
    if (list) list.push(row)
    else byWatch.set(row.watch_id, [row])
  }
  const out = new Map<string, CurrentValue & { row: T }>()
  for (const [watchId, list] of byWatch) {
    const picked = pickCurrentValue(list)
    if (picked) out.set(watchId, picked)
  }
  return out
}

/**
 * The most recent RESEARCHED estimate, whether or not it is the current value.
 * The watch page shows it beside a manual override ("research said X") and the
 * ask-price suggestion still uses it alone — an assumption or a self-entered
 * number must not set what you list a watch for.
 */
export function latestAgentRow<T extends ValuationRowLike>(
  rows: readonly T[]
): T | null {
  let best: T | null = null
  for (const row of rows) {
    if (row.source !== "agent") continue
    if (best === null || row.valued_at > best.valued_at) best = row
  }
  return best
}

/**
 * Movement between the current value and the one before it — the "is it going
 * up" question. Only observed rows count: a tier row is the same assumption
 * restamped, so a change against it would be measuring an edit, not a market.
 * Null when there is nothing to compare (the "—" rule, as in gain.ts).
 */
export interface ValuationChange {
  cents: number
  pct: number | null
  /** the date of the earlier value being compared against */
  since: string
}

export function valuationChange<T extends ValuationRowLike>(
  rows: readonly T[]
): ValuationChange | null {
  const observed = rows
    .filter((r) => isObserved(r.source))
    .sort((a, b) => (a.valued_at < b.valued_at ? 1 : -1))
  if (observed.length < 2) return null
  const [current, previous] = observed
  const cents = current.value_mid_cents - previous.value_mid_cents
  return {
    cents,
    pct:
      previous.value_mid_cents > 0
        ? (cents / previous.value_mid_cents) * 100
        : null,
    since: previous.valued_at,
  }
}

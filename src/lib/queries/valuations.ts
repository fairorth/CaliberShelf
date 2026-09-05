import { createClient } from "@/lib/supabase/server"
import { currentValueByWatch, type CurrentValue } from "@/lib/valuation"
import type { WatchValuation } from "@/lib/types/watch"

// Valuation row joined with basic watch identity (for the report pages)
export interface ValuationWithWatch extends WatchValuation {
  watch: {
    id: string
    model: string
    nickname: string | null
    reference_number: string | null
    purchase_price_cents: number | null
    brand: { name: string } | null
  }
}

/**
 * Get all valuations for a watch, newest first.
 * RLS restricts results to the owning user.
 */
export async function getValuationsForWatch(
  watchId: string
): Promise<WatchValuation[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("watch_valuations")
    .select("*")
    .eq("watch_id", watchId)
    .order("valued_at", { ascending: false })

  if (error) {
    console.error("Failed to fetch valuations:", error.message)
    return []
  }

  return (data ?? []) as WatchValuation[]
}

/**
 * Get every valuation with its watch identity, newest first.
 * Used by the Watch Valuations report (grouping by run date happens in JS —
 * the dataset stays small: one row per flagged watch per run).
 */
export async function getAllValuations(): Promise<ValuationWithWatch[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("watch_valuations")
    .select(
      "*, watch:watches(id, model, nickname, reference_number, purchase_price_cents, brand:brands(name))"
    )
    // Static tier estimates are excluded: this report groups rows into RUNS,
    // and a hundred rows all stamped the moment someone edited a percentage is
    // not a run. They belong to Config -> Tiers, not to the agent's history.
    .neq("source", "tier")
    .order("valued_at", { ascending: false })

  if (error) {
    console.error("Failed to fetch valuations:", error.message)
    return []
  }

  // Junction/nested joins need a cast — TS infers any[] for the relation
  return (data ?? []) as unknown as ValuationWithWatch[]
}

/**
 * The current value of every watch — source, date and all — keyed by watch_id
 * and serializable to Client Components. All three sources are in play;
 * `pickCurrentValue` in src/lib/valuation.ts decides between them, and it is
 * the only thing allowed to. Every list and total goes through here.
 */
export async function getCurrentValues(): Promise<Record<string, CurrentValue>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("watch_valuations")
    .select("watch_id, value_mid_cents, valued_at, source")
    .order("valued_at", { ascending: false })

  if (error) {
    console.error("Failed to fetch valuations:", error.message)
    return {}
  }

  const out: Record<string, CurrentValue> = {}
  for (const [watchId, v] of currentValueByWatch(
    (data ?? []) as Parameters<typeof currentValueByWatch>[0]
  )) {
    out[watchId] = { cents: v.cents, source: v.source, valuedAt: v.valuedAt }
  }
  return out
}

/**
 * Current value mid (cents) per watch — the numeric shape the collection table
 * and the CSV take. A thin projection of getCurrentValues() so there is still
 * exactly one place the precedence rule is applied.
 */
export async function getLatestValuationMids(): Promise<Record<string, number>> {
  const values = await getCurrentValues()
  const mids: Record<string, number> = {}
  for (const [watchId, v] of Object.entries(values)) mids[watchId] = v.cents
  return mids
}

/** Local calendar date ("YYYY-MM-DD") a valuation ran on. */
export function valuationRunDate(valuedAt: string): string {
  const d = new Date(valuedAt)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export interface ValuationRunSummary {
  date: string // "YYYY-MM-DD" (local)
  count: number
  totalMidCents: number
  confidences: { high: number; medium: number; low: number }
}

/** Group valuations into per-date run summaries, newest first. */
export function groupValuationRuns(
  valuations: ValuationWithWatch[]
): ValuationRunSummary[] {
  const byDate = new Map<string, ValuationRunSummary>()
  for (const v of valuations) {
    const date = valuationRunDate(v.valued_at)
    let run = byDate.get(date)
    if (!run) {
      run = { date, count: 0, totalMidCents: 0, confidences: { high: 0, medium: 0, low: 0 } }
      byDate.set(date, run)
    }
    run.count++
    run.totalMidCents += v.value_mid_cents
    run.confidences[v.confidence]++
  }
  return [...byDate.values()].sort((a, b) => (a.date < b.date ? 1 : -1))
}

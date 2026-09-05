import { createClient } from "@/lib/supabase/server"
import {
  currentValueByWatch,
  valuationChange,
  type ValuationChange,
} from "@/lib/valuation"
import { gainVersusBasis, type GainFigure } from "./gain"
import type { ValuationSource } from "@/lib/types/watch"

// ── The Watch Values report (portfolio examination) ─────────────
//
// The question nothing else answered: not "what is the collection worth" (the
// Market strip) and not "what do I own" (the Watch List), but "what is each
// watch worth, HOW DO I KNOW, and which way is it moving".
//
// The first two columns are the point. A portfolio total that mixes 28
// researched estimates with 85 tier percentages is one number wearing two
// different claims to truth; this is the screen that pulls them apart, per
// watch and in the subtotals.
//
// Every figure here comes from the shared helpers — `pickCurrentValue` for the
// value, `gainVersusBasis` for the gain, `valuationChange` for the movement.
// This file computes no money of its own.

export interface WatchValueRow {
  id: string
  brand: string
  model: string
  nickname: string | null
  /** Owned · Coming Soon · For Sale — wish-list and sold rows are excluded. */
  status: string
  currentValueCents: number | null
  source: ValuationSource | null
  /** "YYYY-MM-DD" the current value is dated. */
  valuedOn: string | null
  purchasePriceCents: number | null
  costBasisCents: number
  /** vs cost basis; null when the purchase price is unknown (the "—" rule). */
  gain: GainFigure | null
  /** movement vs the previous DATED valuation; null for most watches. */
  change: ValuationChange | null
  /** how many valuations this watch has ever carried. */
  valuationCount: number
  /** is the valuation agent researching this watch (watches.price_check_enabled)? */
  researching: boolean
  /** Research needs a reference number — enforced by a Zod refine, a DB CHECK
   *  and setPriceTracking. Without one the toggle has to be disabled rather
   *  than fail on click, which is the common case: most of the collection has
   *  no reference. */
  reference: string | null
}

export interface SourceSubtotal {
  source: ValuationSource
  count: number
  valueCents: number
  basisCents: number
  gain: GainFigure | null
}

export interface WatchValuesReport {
  rows: WatchValueRow[]
  /** One per source that actually has rows, in precedence order. */
  bySource: SourceSubtotal[]
  totals: {
    watchCount: number
    valuedCount: number
    valueCents: number
    basisCents: number
    gain: GainFigure | null
    /** watches whose value moved since their previous valuation. */
    movedCount: number
  }
}

interface WatchRow {
  id: string
  model: string
  nickname: string | null
  reference_number: string | null
  price_check_enabled: boolean
  sale_status: string
  purchase_price_cents: number | null
  cost_basis_cents: number
  is_wishlist: boolean
  is_coming_soon: boolean
  brand: { name: string } | null
}

interface ValuationRow {
  watch_id: string
  value_mid_cents: number
  valued_at: string
  source: ValuationSource
}

const SOURCE_ORDER: ValuationSource[] = ["agent", "manual", "tier"]

export async function getWatchValuesReport(): Promise<WatchValuesReport> {
  const supabase = await createClient()

  const [watchesRes, valuationsRes] = await Promise.all([
    supabase
      .from("watches")
      .select(
        "id, model, nickname, reference_number, price_check_enabled, sale_status, purchase_price_cents, cost_basis_cents, is_wishlist, is_coming_soon, brand:brands(name)"
      ),
    supabase
      .from("watch_valuations")
      .select("watch_id, value_mid_cents, valued_at, source")
      .order("valued_at", { ascending: false }),
  ])
  if (watchesRes.error) {
    console.error("Failed to fetch watches:", watchesRes.error.message)
  }
  if (valuationsRes.error) {
    console.error("Failed to fetch valuations:", valuationsRes.error.message)
  }

  const valuations = (valuationsRes.data ?? []) as ValuationRow[]
  const current = currentValueByWatch(valuations)

  const byWatch = new Map<string, ValuationRow[]>()
  for (const v of valuations) {
    const list = byWatch.get(v.watch_id)
    if (list) list.push(v)
    else byWatch.set(v.watch_id, [v])
  }

  // Sold watches belong to the Watch Sales report — a realized number is not a
  // valuation. Wish-list watches were never bought, so they have no basis to
  // measure against.
  const watches = ((watchesRes.data ?? []) as unknown as WatchRow[]).filter(
    (w) => !w.is_wishlist && w.sale_status !== "sold"
  )

  const rows: WatchValueRow[] = watches
    .map((w) => {
      const value = current.get(w.id) ?? null
      return {
        id: w.id,
        brand: w.brand?.name ?? "",
        model: w.model,
        nickname: w.nickname,
        status:
          w.sale_status === "listed"
            ? "For Sale"
            : w.is_coming_soon
              ? "Coming Soon"
              : "Owned",
        currentValueCents: value?.cents ?? null,
        source: value?.source ?? null,
        valuedOn: value?.valuedAt.slice(0, 10) ?? null,
        purchasePriceCents: w.purchase_price_cents,
        costBasisCents: w.cost_basis_cents,
        gain:
          value != null
            ? gainVersusBasis(value.cents, {
                cost_basis_cents: w.cost_basis_cents,
                purchase_price_cents: w.purchase_price_cents,
              })
            : null,
        change: valuationChange(byWatch.get(w.id) ?? []),
        valuationCount: (byWatch.get(w.id) ?? []).length,
        researching: w.price_check_enabled,
        reference: w.reference_number,
      }
    })
    // Most valuable first: this is a portfolio examination, and the watches
    // carrying the most money are the ones worth examining.
    .sort((a, b) => (b.currentValueCents ?? -1) - (a.currentValueCents ?? -1))

  const bySource: SourceSubtotal[] = []
  for (const source of SOURCE_ORDER) {
    const group = rows.filter((r) => r.source === source)
    if (group.length === 0) continue
    bySource.push({
      source,
      count: group.length,
      valueCents: group.reduce((sum, r) => sum + (r.currentValueCents ?? 0), 0),
      basisCents: group.reduce((sum, r) => sum + r.costBasisCents, 0),
      gain: aggregate(group),
    })
  }

  const valued = rows.filter((r) => r.currentValueCents != null)
  return {
    rows,
    bySource,
    totals: {
      watchCount: rows.length,
      valuedCount: valued.length,
      valueCents: valued.reduce((sum, r) => sum + (r.currentValueCents ?? 0), 0),
      basisCents: valued.reduce((sum, r) => sum + r.costBasisCents, 0),
      gain: aggregate(valued),
      movedCount: rows.filter((r) => r.change != null && r.change.cents !== 0).length,
    },
  }
}

/** Sum of gains over the rows that have one — never value minus a basis from
 *  a different set of watches (the rule in gain.ts). */
function aggregate(rows: WatchValueRow[]): GainFigure | null {
  let cents = 0
  let basis = 0
  let n = 0
  for (const r of rows) {
    if (!r.gain) continue
    cents += r.gain.cents
    basis += r.costBasisCents
    n++
  }
  if (n === 0) return null
  return { cents, pct: basis > 0 ? (cents / basis) * 100 : null }
}

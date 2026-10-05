import { createClient } from "@/lib/supabase/server"
import { getWatches } from "./watches"
import { currentValueByWatch } from "@/lib/valuation"
import { gainVersusBasis, type GainFigure } from "./gain"
import type { Attachment, ValuationSource } from "@/lib/types/watch"

// The To Sell view (00054): every watch on its way out, and whether together
// they reach the goal. Three stages, each counted at the number that is TRUE
// for that stage:
//
//   sold     net proceeds (already net of every fee) — only sales made since
//            the goal was set, so last year's sales do not fund this year's
//            watch
//   listed   the ask, less the fee haircut
//   decided  the current value (valuation.ts decides which), less the haircut
//
// The haircut never touches a sold watch: its fees are already in its net.

export type ToSellStage = "sold" | "listed" | "decided"

export interface ToSellRow {
  id: string
  name: string
  nickname: string | null
  thumbUrl: string | null
  stage: ToSellStage
  attachment: Attachment | null
  /** Gross figure: net proceeds (sold), ask (listed), current value (decided). */
  grossCents: number | null
  /** What it should put in your pocket: gross less the haircut (not sold). */
  netCents: number | null
  /** decided rows only — which source produced the value. */
  source: ValuationSource | null
  /** net vs cost basis; null when the purchase price is unknown. */
  gain: GainFigure | null
  /** "YYYY-MM-DD": sold_at for sold rows. */
  soldAt: string | null
}

export interface SaleGoal {
  goalCents: number | null
  label: string | null
  setAt: string | null
  feePct: number
}

export interface ToSellReport {
  goal: SaleGoal
  rows: ToSellRow[]
  /** Maybe-pile watches with a value, most valuable first — what could close a gap. */
  maybes: ToSellRow[]
  totals: {
    soldCents: number
    listedCents: number
    decidedCents: number
    totalCents: number
    /** Of decidedCents, the part resting on static (tier) estimates. */
    staticCents: number
    staticCount: number
    /** Decided watches with no value at all. */
    unvaluedCount: number
  }
}

interface WatchMoney {
  cost_basis_cents: number
  purchase_price_cents: number | null
}

export async function getToSellReport(): Promise<ToSellReport> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [watches, profileRes, valuationsRes, listingsRes, salesRes] = await Promise.all([
    getWatches(),
    user
      ? supabase
          .from("profiles")
          .select("sale_goal_cents, sale_goal_label, sale_goal_set_at, sale_fee_pct")
          .eq("id", user.id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase.from("watch_valuations").select("watch_id, value_mid_cents, valued_at, source"),
    supabase.from("watch_listings").select("watch_id, ask_price_cents").eq("status", "active"),
    supabase.from("watch_sales").select("watch_id, sold_at, net_proceeds_cents"),
  ])
  if (profileRes.error) console.error("Failed to fetch sale goal:", profileRes.error.message)

  const p = profileRes.data as {
    sale_goal_cents: number | null
    sale_goal_label: string | null
    sale_goal_set_at: string | null
    sale_fee_pct: number | string | null
  } | null
  const goal: SaleGoal = {
    goalCents: p?.sale_goal_cents ?? null,
    label: p?.sale_goal_label ?? null,
    setAt: p?.sale_goal_set_at ?? null,
    // NUMERIC arrives as a string from PostgREST.
    feePct: p?.sale_fee_pct != null ? Number(p.sale_fee_pct) : 8,
  }
  const keepShare = 1 - goal.feePct / 100

  const values = currentValueByWatch(
    (valuationsRes.data ?? []) as Array<{
      watch_id: string
      value_mid_cents: number
      valued_at: string
      source: ValuationSource
    }>
  )
  const askByWatch = new Map(
    ((listingsRes.data ?? []) as Array<{ watch_id: string; ask_price_cents: number }>).map((l) => [
      l.watch_id,
      l.ask_price_cents,
    ])
  )
  const saleByWatch = new Map(
    ((salesRes.data ?? []) as Array<{ watch_id: string; sold_at: string; net_proceeds_cents: number }>).map(
      (s) => [s.watch_id, s]
    )
  )
  const goalStart = goal.setAt ? goal.setAt.slice(0, 10) : null

  const gainOf = (net: number | null, w: WatchMoney) => (net != null ? gainVersusBasis(net, w) : null)

  const rows: ToSellRow[] = []
  const maybes: ToSellRow[] = []
  for (const w of watches) {
    if (w.is_wishlist) continue
    const base = {
      id: w.id,
      name: `${w.brand?.name ?? ""} ${w.model}`.trim(),
      nickname: w.nickname,
      thumbUrl: w.cover_thumb_url ?? w.cover_photo_url,
      attachment: w.attachment,
    }

    if (w.sale_status === "sold") {
      const sale = saleByWatch.get(w.id)
      // Only sales since the goal was set count toward it.
      if (!sale || !goalStart || sale.sold_at < goalStart) continue
      rows.push({
        ...base,
        stage: "sold",
        grossCents: sale.net_proceeds_cents,
        netCents: sale.net_proceeds_cents,
        source: null,
        gain: gainOf(sale.net_proceeds_cents, w),
        soldAt: sale.sold_at,
      })
      continue
    }

    if (w.sale_status === "listed") {
      const ask = askByWatch.get(w.id) ?? null
      const net = ask != null ? Math.round(ask * keepShare) : null
      rows.push({ ...base, stage: "listed", grossCents: ask, netCents: net, source: null, gain: gainOf(net, w), soldAt: null })
      continue
    }

    const v = values.get(w.id) ?? null
    const net = v ? Math.round(v.cents * keepShare) : null
    const row: ToSellRow = {
      ...base,
      stage: "decided",
      grossCents: v?.cents ?? null,
      netCents: net,
      source: v?.source ?? null,
      gain: gainOf(net, w),
      soldAt: null,
    }
    if (w.keep_decision === "sell") rows.push(row)
    else if (w.keep_decision === "maybe" && v) maybes.push(row)
  }

  const STAGE_ORDER: Record<ToSellStage, number> = { sold: 0, listed: 1, decided: 2 }
  rows.sort(
    (a, b) => STAGE_ORDER[a.stage] - STAGE_ORDER[b.stage] || (b.netCents ?? -1) - (a.netCents ?? -1)
  )
  maybes.sort((a, b) => (b.netCents ?? 0) - (a.netCents ?? 0))

  const sum = (stage: ToSellStage) =>
    rows.filter((r) => r.stage === stage).reduce((s, r) => s + (r.netCents ?? 0), 0)
  const decided = rows.filter((r) => r.stage === "decided")
  const staticRows = decided.filter((r) => r.source === "tier")
  const soldCents = sum("sold")
  const listedCents = sum("listed")
  const decidedCents = sum("decided")

  return {
    goal,
    rows,
    maybes,
    totals: {
      soldCents,
      listedCents,
      decidedCents,
      totalCents: soldCents + listedCents + decidedCents,
      staticCents: staticRows.reduce((s, r) => s + (r.netCents ?? 0), 0),
      staticCount: staticRows.length,
      unvaluedCount: decided.filter((r) => r.netCents == null).length,
    },
  }
}

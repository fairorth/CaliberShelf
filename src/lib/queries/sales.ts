import { createClient } from "@/lib/supabase/server"
import { getTransformedSignedUrls } from "@/lib/storage"
import type { SaleVenue, WatchListing, WatchSale } from "@/lib/types/watch"
import {
  aggregateGain,
  daysBetween,
  feesTotalCents,
  gainVersusBasis,
  type GainFigure,
} from "./gain"

// Sale-side queries (Phase 5). Together with portfolio.ts this file is where
// EVERY gain number comes from — components render these shapes and never
// compute a gain inline. The pure arithmetic itself lives in ./gain (so the
// client-side sale ledger can share it) and is re-exported here.
export {
  aggregateGain,
  daysBetween,
  feesTotalCents,
  gainVersusBasis,
  saleLedgerPreview,
  type GainFigure,
  type SaleLedgerPreview,
} from "./gain"

/** A listing is aging once it has been active this many days (§3.2). */
export const LISTING_AGING_DAYS = 45
/** A valuation is stale once it is older than this (V5). */
export const STALE_VALUATION_DAYS = 90
/** "Recently sold" on the Market pipeline = the last N days (§3.2). */
export const RECENT_SOLD_DAYS = 90

/** Today as a local "YYYY-MM-DD" — the DATE columns are calendar dates. */
export function todayDate(): string {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${d.getFullYear()}-${m}-${day}`
}

// ── Watch identity shared by every sale-side shape ──────────────

export interface SaleWatchRef {
  watchId: string
  /** "Brand Model" */
  name: string
  nickname: string | null
  /** ~192px cover thumb — these render in dense cells. */
  thumbUrl: string | null
}

// Minimal watch fields the joins below select.
interface JoinedWatch {
  id: string
  model: string
  nickname: string | null
  purchase_date: string | null
  purchase_price_cents: number | null
  cost_basis_cents: number
  target_ask_cents: number | null
  candidate_since: string | null
  candidate_note: string | null
  sale_status: string
  brand: { name: string } | null
}

const WATCH_JOIN =
  "id, model, nickname, purchase_date, purchase_price_cents, cost_basis_cents, target_ask_cents, candidate_since, candidate_note, sale_status, brand:brands(name)"

function watchName(w: JoinedWatch): string {
  return `${w.brand?.name ?? ""} ${w.model}`.trim()
}

/** Cover-thumb signed URLs (192px) for a set of watches, keyed by watch id. */
async function coverThumbUrls(
  supabase: Awaited<ReturnType<typeof createClient>>,
  watchIds: string[]
): Promise<Map<string, string>> {
  const urls = new Map<string, string>()
  if (watchIds.length === 0) return urls
  const { data: covers } = await supabase
    .from("watch_photos")
    .select("watch_id, storage_path, thumb_path")
    .in("watch_id", watchIds)
    .eq("is_cover", true)
  if (!covers || covers.length === 0) return urls
  const pathByWatch = new Map<string, string>()
  for (const p of covers as Array<{ watch_id: string; storage_path: string; thumb_path: string | null }>) {
    pathByWatch.set(p.watch_id, p.thumb_path ?? p.storage_path)
  }
  const signed = await getTransformedSignedUrls([...pathByWatch.values()], {
    width: 192,
    height: 192,
    resize: "contain",
    quality: 82,
  })
  for (const [watchId, path] of pathByWatch) {
    const url = signed.get(path)
    if (url) urls.set(watchId, url)
  }
  return urls
}

// ── Per-watch lookups (Market panel + dialogs) ──────────────────

/** The watch's open listing, or null. At most one exists (partial unique index). */
export async function getActiveListing(
  watchId: string
): Promise<WatchListing | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("watch_listings")
    .select("*")
    .eq("watch_id", watchId)
    .eq("status", "active")
    .maybeSingle()
  if (error) {
    console.error("Failed to fetch active listing:", error.message)
    return null
  }
  return data as WatchListing | null
}

/** The watch's sale record, or null. At most one exists (UNIQUE watch_id). */
export async function getSaleForWatch(
  watchId: string
): Promise<WatchSale | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("watch_sales")
    .select("*")
    .eq("watch_id", watchId)
    .maybeSingle()
  if (error) {
    console.error("Failed to fetch sale:", error.message)
    return null
  }
  return data as WatchSale | null
}

// ── Sold treatment in the collection (§3.6) ─────────────────────

/** What a sold row needs to replace its price cell, keyed by watch id.
 *  Plain objects so a Server Component can hand this to the client list. */
export interface SaleSummary {
  soldAt: string
  netProceedsCents: number
  gain: GainFigure | null
}

/**
 * Net proceeds and realized gain for every sold watch. The collection shows
 * these instead of the purchase price on a sold row — the gain is computed
 * here, never in the table component.
 */
export async function getSaleSummaries(): Promise<Record<string, SaleSummary>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("watch_sales")
    .select(
      "watch_id, sold_at, net_proceeds_cents, watch:watches(cost_basis_cents, purchase_price_cents)"
    )
  if (error) {
    console.error("Failed to fetch sale summaries:", error.message)
    return {}
  }
  const summaries: Record<string, SaleSummary> = {}
  for (const s of (data ?? []) as unknown as Array<{
    watch_id: string
    sold_at: string
    net_proceeds_cents: number
    watch: { cost_basis_cents: number; purchase_price_cents: number | null }
  }>) {
    summaries[s.watch_id] = {
      soldAt: s.sold_at,
      netProceedsCents: s.net_proceeds_cents,
      gain: gainVersusBasis(s.net_proceeds_cents, s.watch),
    }
  }
  return summaries
}

// ── Pipeline (§3.2 block 3) ─────────────────────────────────────

export interface CandidateCard extends SaleWatchRef {
  targetAskCents: number | null
  candidateSince: string | null
  candidateNote: string | null
}

export interface ListedCard extends SaleWatchRef {
  askPriceCents: number
  listedAt: string
  /** whole days since listed_at — drives the DAY n chip (amber past 45). */
  daysOnMarket: number
  venue: SaleVenue
  venueOther: string | null
  listingUrl: string | null
}

export interface RecentlySoldCard extends SaleWatchRef {
  soldAt: string
  netProceedsCents: number
  gain: GainFigure | null
}

export interface SalePipeline {
  candidates: CandidateCard[]
  listed: ListedCard[]
  recentlySold: RecentlySoldCard[]
}

/** The three Market pipeline columns: Candidates, Listed, Recently sold. */
export async function getSalePipeline(): Promise<SalePipeline> {
  const supabase = await createClient()
  const today = todayDate()

  const [candidatesRes, listingsRes, salesRes] = await Promise.all([
    supabase
      .from("watches")
      .select(WATCH_JOIN)
      .eq("sale_status", "candidate")
      .order("candidate_since", { ascending: true, nullsFirst: false }),
    supabase
      .from("watch_listings")
      .select(`*, watch:watches(${WATCH_JOIN})`)
      .eq("status", "active")
      .order("listed_at", { ascending: true }),
    supabase
      .from("watch_sales")
      .select(`*, watch:watches(${WATCH_JOIN})`)
      .order("sold_at", { ascending: false }),
  ])

  const candidates = (candidatesRes.data ?? []) as unknown as JoinedWatch[]
  const listings = (listingsRes.data ?? []) as unknown as (WatchListing & {
    watch: JoinedWatch
  })[]
  const recentCutoff = Date.parse(today) - RECENT_SOLD_DAYS * 86_400_000
  const sales = ((salesRes.data ?? []) as unknown as (WatchSale & {
    watch: JoinedWatch
  })[]).filter((s) => Date.parse(s.sold_at) >= recentCutoff)

  const thumbs = await coverThumbUrls(supabase, [
    ...candidates.map((w) => w.id),
    ...listings.map((l) => l.watch.id),
    ...sales.map((s) => s.watch.id),
  ])

  return {
    candidates: candidates.map((w) => ({
      watchId: w.id,
      name: watchName(w),
      nickname: w.nickname,
      thumbUrl: thumbs.get(w.id) ?? null,
      targetAskCents: w.target_ask_cents,
      candidateSince: w.candidate_since,
      candidateNote: w.candidate_note,
    })),
    listed: listings.map((l) => ({
      watchId: l.watch.id,
      name: watchName(l.watch),
      nickname: l.watch.nickname,
      thumbUrl: thumbs.get(l.watch.id) ?? null,
      askPriceCents: l.ask_price_cents,
      listedAt: l.listed_at,
      daysOnMarket: daysBetween(l.listed_at, today) ?? 0,
      venue: l.venue,
      venueOther: l.venue_other,
      listingUrl: l.listing_url,
    })),
    recentlySold: sales.map((s) => ({
      watchId: s.watch.id,
      name: watchName(s.watch),
      nickname: s.watch.nickname,
      thumbUrl: thumbs.get(s.watch.id) ?? null,
      soldAt: s.sold_at,
      netProceedsCents: s.net_proceeds_cents,
      gain: gainVersusBasis(s.net_proceeds_cents, s.watch),
    })),
  }
}

// ── Market attention (§3.2 block 4) ─────────────────────────────

export interface MarketAttentionItem {
  kind: "listing_aging" | "valuation_stale" | "sale_missing_fees"
  watchId: string
  name: string
  /** ready-to-render detail, e.g. "listed 52 days ago on r/WatchExchange" */
  detail: string
  href: string
}

/**
 * The inline attention list on /market: listings older than 45 days, tracked
 * watches whose latest valuation is over 90 days old, and sold watches with
 * no fee data at all (all four fee columns zero — fees were likely never
 * entered, and Realized Gains would overstate the net).
 */
export async function getMarketAttention(): Promise<MarketAttentionItem[]> {
  const supabase = await createClient()
  const today = todayDate()

  const [listingsRes, trackedRes, valuationsRes, salesRes] = await Promise.all([
    supabase
      .from("watch_listings")
      .select(`*, watch:watches(${WATCH_JOIN})`)
      .eq("status", "active"),
    supabase
      .from("watches")
      .select(WATCH_JOIN)
      .eq("price_check_enabled", true)
      .neq("sale_status", "sold"),
    supabase
      .from("watch_valuations")
      .select("watch_id, valued_at, source")
      .eq("source", "agent")
      .order("valued_at", { ascending: false }),
    supabase
      .from("watch_sales")
      .select(`*, watch:watches(${WATCH_JOIN})`),
  ])

  const items: MarketAttentionItem[] = []

  for (const l of (listingsRes.data ?? []) as unknown as (WatchListing & {
    watch: JoinedWatch
  })[]) {
    const days = daysBetween(l.listed_at, today) ?? 0
    if (days > LISTING_AGING_DAYS) {
      items.push({
        kind: "listing_aging",
        watchId: l.watch.id,
        name: watchName(l.watch),
        detail: `listed ${days} days ago`,
        href: `/watch/${l.watch.id}`,
      })
    }
  }

  // Latest agent valuation per watch (rows arrive newest-first).
  const latestValuedAt = new Map<string, string>()
  for (const v of (valuationsRes.data ?? []) as Array<{
    watch_id: string
    valued_at: string
  }>) {
    if (!latestValuedAt.has(v.watch_id)) latestValuedAt.set(v.watch_id, v.valued_at)
  }
  for (const w of (trackedRes.data ?? []) as unknown as JoinedWatch[]) {
    const valuedAt = latestValuedAt.get(w.id)
    if (!valuedAt) continue // never valued — the first run covers it
    const age = daysBetween(valuedAt.slice(0, 10), today) ?? 0
    if (age > STALE_VALUATION_DAYS) {
      items.push({
        kind: "valuation_stale",
        watchId: w.id,
        name: watchName(w),
        detail: `valuation ${age} days old`,
        href: `/watch/${w.id}`,
      })
    }
  }

  for (const s of (salesRes.data ?? []) as unknown as (WatchSale & {
    watch: JoinedWatch
  })[]) {
    if (feesTotalCents(s) === 0) {
      items.push({
        kind: "sale_missing_fees",
        watchId: s.watch.id,
        name: watchName(s.watch),
        detail: "sale has no fee data",
        href: `/watch/${s.watch.id}`,
      })
    }
  }

  return items
}

// ── Sold archive (§3.7) + Realized Gains (§4.1) ─────────────────

export interface SoldArchiveRow extends SaleWatchRef {
  saleId: string
  soldAt: string
  /** days between purchase and sale; null when purchase date is unknown. */
  heldDays: number | null
  venue: SaleVenue
  venueOther: string | null
  costBasisCents: number
  /** false = purchase price unknown → basis is acq-costs-only and every gain
   *  figure for this row renders "—". */
  basisKnown: boolean
  salePriceCents: number
  feesCents: number
  netProceedsCents: number
  gain: GainFigure | null
}

export interface SaleTotals {
  salesCount: number
  salePriceCents: number
  feesCents: number
  netProceedsCents: number
  /** summed over rows with a known basis; null when none are computable. */
  gain: GainFigure | null
}

export interface SoldArchive {
  rows: SoldArchiveRow[]
  totals: SaleTotals
}

function toArchiveRow(
  s: WatchSale & { watch: JoinedWatch },
  thumbs: Map<string, string>
): SoldArchiveRow {
  return {
    saleId: s.id,
    watchId: s.watch.id,
    name: watchName(s.watch),
    nickname: s.watch.nickname,
    thumbUrl: thumbs.get(s.watch.id) ?? null,
    soldAt: s.sold_at,
    heldDays: daysBetween(s.watch.purchase_date, s.sold_at),
    venue: s.venue,
    venueOther: s.venue_other,
    costBasisCents: s.watch.cost_basis_cents,
    basisKnown: s.watch.purchase_price_cents != null,
    salePriceCents: s.sale_price_cents,
    feesCents: feesTotalCents(s),
    netProceedsCents: s.net_proceeds_cents,
    gain: gainVersusBasis(s.net_proceeds_cents, s.watch),
  }
}

function totalsFor(rows: SoldArchiveRow[]): SaleTotals {
  return {
    salesCount: rows.length,
    salePriceCents: rows.reduce((sum, r) => sum + r.salePriceCents, 0),
    feesCents: rows.reduce((sum, r) => sum + r.feesCents, 0),
    netProceedsCents: rows.reduce((sum, r) => sum + r.netProceedsCents, 0),
    gain: aggregateGain(
      // Archive rows carry basisKnown instead of the raw purchase price;
      // aggregateGain only null-checks that field, so 0 stands in for "known".
      rows.map((r) => ({
        valueCents: r.netProceedsCents,
        watch: {
          cost_basis_cents: r.costBasisCents,
          purchase_price_cents: r.basisKnown ? 0 : null,
        },
      }))
    ),
  }
}

async function fetchSalesWithWatch(): Promise<SoldArchiveRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("watch_sales")
    .select(`*, watch:watches(${WATCH_JOIN})`)
    .order("sold_at", { ascending: false })
  if (error) {
    console.error("Failed to fetch sales:", error.message)
    return []
  }
  const sales = (data ?? []) as unknown as (WatchSale & { watch: JoinedWatch })[]
  const thumbs = await coverThumbUrls(
    supabase,
    sales.map((s) => s.watch.id)
  )
  return sales.map((s) => toArchiveRow(s, thumbs))
}

/** One row per sale, newest first, with footer totals (§3.7). */
export async function getSoldArchive(): Promise<SoldArchive> {
  const rows = await fetchSalesWithWatch()
  return { rows, totals: totalsFor(rows) }
}

export interface RealizedGainsYear {
  year: number
  rows: SoldArchiveRow[]
  subtotal: SaleTotals
}

export interface RealizedGains {
  years: RealizedGainsYear[]
  lifetime: SaleTotals & {
    /** sales with a computable gain > 0. */
    winCount: number
  }
}

/** Per-sale P&L grouped by year, newest first, with lifetime totals (§4.1). */
export async function getRealizedGains(): Promise<RealizedGains> {
  const rows = await fetchSalesWithWatch()
  const byYear = new Map<number, SoldArchiveRow[]>()
  for (const r of rows) {
    const year = parseInt(r.soldAt.slice(0, 4), 10)
    const list = byYear.get(year) ?? []
    list.push(r)
    byYear.set(year, list)
  }
  const years = [...byYear.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([year, yearRows]) => ({
      year,
      rows: yearRows,
      subtotal: totalsFor(yearRows),
    }))
  return {
    years,
    lifetime: {
      ...totalsFor(rows),
      winCount: rows.filter((r) => r.gain !== null && r.gain.cents > 0).length,
    },
  }
}

// ── Annual Summary (§4.2) ───────────────────────────────────────

export interface AcquisitionRow extends SaleWatchRef {
  purchaseDate: string
  purchasePriceCents: number | null
  /** shipping + tax + duty */
  acqCostsCents: number
  costBasisCents: number
}

export interface AnnualSummary {
  year: number
  /** every year that has a purchase or a sale, newest first. */
  availableYears: number[]
  acquisitions: {
    rows: AcquisitionRow[]
    totalInvestedCents: number
  }
  sales: {
    rows: SoldArchiveRow[]
    totals: SaleTotals
  }
  position: {
    /** end-of-year: owned watches (not wishlist/coming-soon) not yet sold. */
    countOwned: number
    costBasisCents: number
    /** latest agent valuation as of Dec 31 of the year, tracked watches. */
    currentValueCents: number
    unrealized: GainFigure | null
  }
  feesByVenue: Array<{
    venue: SaleVenue
    venueOther: string | null
    feesCents: number
  }>
  feesTotalCents: number
}

interface AnnualWatchRow {
  id: string
  model: string
  nickname: string | null
  purchase_date: string | null
  purchase_price_cents: number | null
  acq_shipping_cents: number | null
  acq_tax_cents: number | null
  acq_duty_cents: number | null
  cost_basis_cents: number
  price_check_enabled: boolean
  is_wishlist: boolean
  is_coming_soon: boolean
  brand: { name: string } | null
}

/** The records/tax view: one year's acquisitions, sales, position, fees. */
export async function getAnnualSummary(
  requestedYear?: number
): Promise<AnnualSummary | null> {
  const supabase = await createClient()

  const [watchesRes, salesRes, valuationsRes] = await Promise.all([
    supabase
      .from("watches")
      .select(
        "id, model, nickname, purchase_date, purchase_price_cents, acq_shipping_cents, acq_tax_cents, acq_duty_cents, cost_basis_cents, price_check_enabled, is_wishlist, is_coming_soon, brand:brands(name)"
      ),
    supabase
      .from("watch_sales")
      .select(`*, watch:watches(${WATCH_JOIN})`)
      .order("sold_at", { ascending: false }),
    supabase
      .from("watch_valuations")
      .select("watch_id, value_mid_cents, valued_at, source")
      .eq("source", "agent")
      .order("valued_at", { ascending: false }),
  ])

  const watches = ((watchesRes.data ?? []) as unknown as AnnualWatchRow[]).filter(
    (w) => !w.is_wishlist && !w.is_coming_soon
  )
  const sales = (salesRes.data ?? []) as unknown as (WatchSale & {
    watch: JoinedWatch
  })[]

  // Years derived from data (§4.2): any purchase or sale year.
  const yearSet = new Set<number>()
  for (const w of watches) {
    if (w.purchase_date) yearSet.add(parseInt(w.purchase_date.slice(0, 4), 10))
  }
  for (const s of sales) yearSet.add(parseInt(s.sold_at.slice(0, 4), 10))
  const availableYears = [...yearSet].sort((a, b) => b - a)
  if (availableYears.length === 0) return null
  const year =
    requestedYear && yearSet.has(requestedYear) ? requestedYear : availableYears[0]
  const yearEnd = `${year}-12-31`

  // Acquisitions: bought this year.
  const acquired = watches.filter((w) => w.purchase_date?.startsWith(`${year}`))
  const thumbs = await coverThumbUrls(supabase, [
    ...acquired.map((w) => w.id),
    ...sales.map((s) => s.watch.id),
  ])
  const acquisitionRows: AcquisitionRow[] = acquired
    .sort((a, b) => (a.purchase_date! < b.purchase_date! ? 1 : -1))
    .map((w) => ({
      watchId: w.id,
      name: `${w.brand?.name ?? ""} ${w.model}`.trim(),
      nickname: w.nickname,
      thumbUrl: thumbs.get(w.id) ?? null,
      purchaseDate: w.purchase_date!,
      purchasePriceCents: w.purchase_price_cents,
      acqCostsCents:
        (w.acq_shipping_cents ?? 0) + (w.acq_tax_cents ?? 0) + (w.acq_duty_cents ?? 0),
      costBasisCents: w.cost_basis_cents,
    }))

  // Sales this year.
  const yearSales = sales.filter((s) => s.sold_at.startsWith(`${year}`))
  const saleRows = yearSales.map((s) => toArchiveRow(s, thumbs))

  // Position at Dec 31: purchased by year end (unknown purchase date counts
  // as owned — it is in the collection), not sold by year end.
  const soldAtByWatch = new Map<string, string>()
  for (const s of sales) soldAtByWatch.set(s.watch.id, s.sold_at)
  const ownedAtYearEnd = watches.filter((w) => {
    if (w.purchase_date && w.purchase_date > yearEnd) return false
    const soldAt = soldAtByWatch.get(w.id)
    return !soldAt || soldAt > yearEnd
  })

  // Latest agent valuation per watch as of Dec 31 (rows arrive newest-first).
  const valueAsOf = new Map<string, number>()
  for (const v of (valuationsRes.data ?? []) as Array<{
    watch_id: string
    value_mid_cents: number
    valued_at: string
  }>) {
    if (v.valued_at.slice(0, 10) > yearEnd) continue
    if (!valueAsOf.has(v.watch_id)) valueAsOf.set(v.watch_id, v.value_mid_cents)
  }
  const valuedOwned = ownedAtYearEnd.filter(
    (w) => w.price_check_enabled && valueAsOf.has(w.id)
  )

  // Fees by venue, this year's sales.
  const feesByVenueMap = new Map<
    string,
    { venue: SaleVenue; venueOther: string | null; feesCents: number }
  >()
  for (const s of yearSales) {
    const key = s.venue === "other" ? `other:${s.venue_other ?? ""}` : s.venue
    const entry =
      feesByVenueMap.get(key) ??
      { venue: s.venue, venueOther: s.venue_other, feesCents: 0 }
    entry.feesCents += feesTotalCents(s)
    feesByVenueMap.set(key, entry)
  }
  const feesByVenue = [...feesByVenueMap.values()].sort(
    (a, b) => b.feesCents - a.feesCents
  )

  return {
    year,
    availableYears,
    acquisitions: {
      rows: acquisitionRows,
      totalInvestedCents: acquisitionRows.reduce(
        (sum, r) => sum + r.costBasisCents,
        0
      ),
    },
    sales: { rows: saleRows, totals: totalsFor(saleRows) },
    position: {
      countOwned: ownedAtYearEnd.length,
      costBasisCents: ownedAtYearEnd.reduce((sum, w) => sum + w.cost_basis_cents, 0),
      currentValueCents: valuedOwned.reduce(
        (sum, w) => sum + (valueAsOf.get(w.id) ?? 0),
        0
      ),
      unrealized: aggregateGain(
        valuedOwned.map((w) => ({
          valueCents: valueAsOf.get(w.id) ?? 0,
          watch: w,
        }))
      ),
    },
    feesByVenue,
    feesTotalCents: feesByVenue.reduce((sum, v) => sum + v.feesCents, 0),
  }
}

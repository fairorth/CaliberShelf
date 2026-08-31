import { createClient } from "@/lib/supabase/server"
import type { Attachment } from "@/lib/types/watch"

// ── The Watch List report (schedule/export view) ────────────────
//
// One row per watch — the basics a records/insurance schedule needs: brand,
// model, nickname, reference, purchase date/price, and the latest AGENT
// valuation (source='agent' only; manual rows never stand in for research,
// same rule as the portfolio).

export interface WatchListRow {
  id: string
  brand: string
  model: string
  nickname: string | null
  reference: string | null
  /** Display label: Owned · Coming Soon · Wish List · For Sale · Sold */
  status: string
  /** How attached the owner is (00051). Null = unrated. */
  attachment: Attachment | null
  isWishlist: boolean
  isSold: boolean
  purchaseDate: string | null
  purchasePriceCents: number | null
  currentValueCents: number | null
  /** "YYYY-MM-DD" of the valuation behind currentValueCents. */
  valuedOn: string | null
}

export interface WatchListReport {
  rows: WatchListRow[]
  totals: {
    watchCount: number
    /** Owned & unsold (wish list excluded) — the set the money totals cover. */
    ownedCount: number
    purchaseCents: number
    currentValueCents: number
    valuedCount: number
  }
}

interface WatchRow {
  id: string
  model: string
  nickname: string | null
  reference_number: string | null
  purchase_date: string | null
  purchase_price_cents: number | null
  sale_status: string
  attachment: Attachment | null
  is_wishlist: boolean
  is_coming_soon: boolean
  brand: { name: string } | null
}

function statusLabel(w: WatchRow): string {
  if (w.sale_status === "sold") return "Sold"
  if (w.is_wishlist) return "Wish List"
  if (w.is_coming_soon) return "Coming Soon"
  if (w.sale_status === "listed") return "For Sale"
  return "Owned"
}

export async function getWatchListReport(): Promise<WatchListReport> {
  const supabase = await createClient()

  const [watchesRes, valuationsRes] = await Promise.all([
    supabase
      .from("watches")
      .select(
        "id, model, nickname, reference_number, purchase_date, purchase_price_cents, sale_status, attachment, is_wishlist, is_coming_soon, brand:brands(name)"
      ),
    supabase
      .from("watch_valuations")
      .select("watch_id, value_mid_cents, valued_at")
      .eq("source", "agent")
      .order("valued_at", { ascending: false }),
  ])
  if (watchesRes.error) {
    console.error("Failed to fetch watches:", watchesRes.error.message)
  }
  if (valuationsRes.error) {
    console.error("Failed to fetch valuations:", valuationsRes.error.message)
  }

  // Latest agent valuation per watch (rows arrive newest-first).
  const latest = new Map<string, { mid: number; at: string }>()
  for (const v of (valuationsRes.data ?? []) as {
    watch_id: string
    value_mid_cents: number
    valued_at: string
  }[]) {
    if (!latest.has(v.watch_id)) {
      latest.set(v.watch_id, { mid: v.value_mid_cents, at: v.valued_at })
    }
  }

  const watches = (watchesRes.data ?? []) as unknown as WatchRow[]
  const rows: WatchListRow[] = watches
    .map((w) => {
      const isSold = w.sale_status === "sold"
      const val = latest.get(w.id)
      return {
        id: w.id,
        brand: w.brand?.name ?? "",
        model: w.model,
        nickname: w.nickname,
        reference: w.reference_number,
        status: statusLabel(w),
        attachment: w.attachment,
        isWishlist: w.is_wishlist,
        isSold,
        purchaseDate: w.purchase_date,
        purchasePriceCents: w.purchase_price_cents,
        // A sold watch's current value is its sale record, not a market
        // estimate — the Watch Sales report owns that story.
        currentValueCents: isSold ? null : (val?.mid ?? null),
        valuedOn: isSold ? null : (val?.at.slice(0, 10) ?? null),
      }
    })
    .sort(
      (a, b) => a.brand.localeCompare(b.brand) || a.model.localeCompare(b.model)
    )

  // Money totals cover owned & unsold watches only — wish-list prices are
  // estimates of a future purchase, sold watches are realized history.
  const ownedRows = rows.filter((r) => !r.isWishlist && !r.isSold)
  return {
    rows,
    totals: {
      watchCount: rows.length,
      ownedCount: ownedRows.length,
      purchaseCents: ownedRows.reduce(
        (sum, r) => sum + (r.purchasePriceCents ?? 0),
        0
      ),
      currentValueCents: ownedRows.reduce(
        (sum, r) => sum + (r.currentValueCents ?? 0),
        0
      ),
      valuedCount: ownedRows.filter((r) => r.currentValueCents != null).length,
    },
  }
}

import { createClient } from "@/lib/supabase/server"
import type { Brand, Movement, Watch } from "@/lib/types/watch"

// One incomplete item, ready to render: what it is, what's missing, where to
// fix it.
export interface AttentionItem {
  id: string
  name: string
  detail: string | null
  missing: string[]
  href: string
  /** Status hint for watches (wish list / coming soon) — null otherwise. */
  status: "wishlist" | "coming_soon" | null
}

export interface AttentionReport {
  brands: AttentionItem[]
  movements: AttentionItem[]
  watches: AttentionItem[]
}

/**
 * Everything with missing critical information, grouped by object type:
 * - Brands: missing store URL or type
 * - Movements (in use only): missing lift angle, beat rate, or type
 * - Watches: missing reference number, caliber, case diameter/height, or
 *   strap width
 */
export async function getAttentionReport(): Promise<AttentionReport> {
  const supabase = await createClient()

  const [{ data: brands }, { data: movements }, { data: watches }] =
    await Promise.all([
      supabase.from("brands").select("*").order("name"),
      supabase.from("movements").select("*").order("caliber_name"),
      supabase
        .from("watches")
        .select("*, brands(name)")
        .order("model"),
    ])

  const allWatches = (watches ?? []) as unknown as (Watch & {
    brands: { name: string } | null
  })[]

  // ── Brands ─────────────────────────────────────────────────────
  const brandItems: AttentionItem[] = []
  for (const b of (brands ?? []) as Brand[]) {
    const missing: string[] = []
    if (!b.store_url) missing.push("Store URL")
    if (!b.brand_type) missing.push("Type")
    if (missing.length > 0) {
      brandItems.push({
        id: b.id,
        name: b.name,
        detail: b.country_of_origin,
        missing,
        href: "/config?tab=brands",
        status: null,
      })
    }
  }

  // ── Movements (in use only) ────────────────────────────────────
  const usedMovementIds = new Set(
    allWatches.map((w) => w.movement_id).filter(Boolean)
  )
  const movementItems: AttentionItem[] = []
  for (const m of (movements ?? []) as Movement[]) {
    if (!usedMovementIds.has(m.id)) continue
    const missing: string[] = []
    if (!m.lift_angle) missing.push("Lift angle")
    if (!m.beat_rate) missing.push("Beat rate")
    if (!m.caliber_type) missing.push("Type")
    if (missing.length > 0) {
      movementItems.push({
        id: m.id,
        name: m.caliber_name,
        detail: m.manufacturer,
        missing,
        href: "/config?tab=movements",
        status: null,
      })
    }
  }

  // ── Watches ────────────────────────────────────────────────────
  const watchItems: AttentionItem[] = []
  for (const w of allWatches) {
    const missing: string[] = []
    if (!w.reference_number) missing.push("Reference #")
    if (!w.movement_id) missing.push("Caliber")
    if (w.case_diameter_mm == null) missing.push("Case diameter")
    if (w.case_height_mm == null) missing.push("Case height")
    if (w.strap_width_mm == null) missing.push("Strap width")
    if (missing.length > 0) {
      watchItems.push({
        id: w.id,
        name: `${w.brands?.name ?? ""} ${w.model}`.trim(),
        detail: w.nickname,
        missing,
        href: `/watch/${w.id}/edit`,
        status: w.is_wishlist ? "wishlist" : w.is_coming_soon ? "coming_soon" : null,
      })
    }
  }

  // Most-incomplete first within each group
  const byMissingCount = (a: AttentionItem, b: AttentionItem) =>
    b.missing.length - a.missing.length || a.name.localeCompare(b.name)

  return {
    brands: brandItems.sort(byMissingCount),
    movements: movementItems.sort(byMissingCount),
    watches: watchItems.sort(byMissingCount),
  }
}

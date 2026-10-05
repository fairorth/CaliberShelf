import { createClient } from "@/lib/supabase/server"
import { getWatches } from "./watches"
import { getGuideMembership } from "./guides"
import { currentValueByWatch } from "@/lib/valuation"
import { normalizeDialColor, sizeBand } from "@/lib/collection-map"
import {
  deriveFunction,
  FREQUENCY_WINDOW_DAYS,
  type EditWatch,
  type Faceoff,
  type WearLogCoverage,
} from "@/lib/the-edit"
import type { ValuationSource, WatchWithCover } from "@/lib/types/watch"
import type { WearFeel } from "@/lib/validations/keep"

// Reads for The Edit (00054). The algorithm itself is pure and lives in
// lib/the-edit.ts; this file only turns rows into its input.

/** Who is in the pool: owned or coming soon, not sold. Listed watches are in
 *  — as already-decided sells — so the target counts what you will END with. */
export function inEditPool(w: Pick<WatchWithCover, "is_wishlist" | "sale_status">): boolean {
  return !w.is_wishlist && w.sale_status !== "sold"
}

export interface EditData {
  watches: EditWatch[]
  faceoffs: Faceoff[]
  coverage: WearLogCoverage
}

function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((Date.parse(toIso) - Date.parse(fromIso)) / 86_400_000)
}

export async function getEditData(): Promise<EditData> {
  const supabase = await createClient()
  const [all, guides, valuationsRes, wearRes, faceoffRes] = await Promise.all([
    getWatches(),
    getGuideMembership(),
    supabase.from("watch_valuations").select("watch_id, value_mid_cents, valued_at, source"),
    supabase.from("wear_logs").select("watch_id, worn_date, feel").order("worn_date", { ascending: false }),
    supabase.from("keep_faceoffs").select("id, winner_id, loser_id, created_at").order("created_at", { ascending: true }),
  ])
  if (valuationsRes.error) console.error("Failed to fetch valuations:", valuationsRes.error.message)
  if (wearRes.error) console.error("Failed to fetch wear logs:", wearRes.error.message)
  if (faceoffRes.error) console.error("Failed to fetch face-offs:", faceoffRes.error.message)

  const values = currentValueByWatch(
    (valuationsRes.data ?? []) as Array<{
      watch_id: string
      value_mid_cents: number
      valued_at: string
      source: ValuationSource
    }>
  )

  const today = new Date().toISOString().slice(0, 10)
  const windowStart = new Date(Date.now() - FREQUENCY_WINDOW_DAYS * 86_400_000).toISOString().slice(0, 10)
  const wears = (wearRes.data ?? []) as Array<{ watch_id: string; worn_date: string; feel: WearFeel | null }>

  const recentByWatch = new Map<string, number>()
  const feelsByWatch = new Map<string, WearFeel[]>()
  const lastByWatch = new Map<string, string>()
  const loggedDays = new Set<string>()
  let wearsInWindow = 0
  let firstWear: string | null = null
  for (const w of wears) {
    if (!lastByWatch.has(w.watch_id)) lastByWatch.set(w.watch_id, w.worn_date)
    if (w.feel) {
      const list = feelsByWatch.get(w.watch_id) ?? []
      list.push(w.feel)
      feelsByWatch.set(w.watch_id, list)
    }
    if (w.worn_date >= windowStart) {
      recentByWatch.set(w.watch_id, (recentByWatch.get(w.watch_id) ?? 0) + 1)
      loggedDays.add(w.worn_date)
      wearsInWindow++
    }
    if (!firstWear || w.worn_date < firstWear) firstWear = w.worn_date
  }

  const pool = all.filter(inEditPool)
  const watches: EditWatch[] = pool.map((w) => {
    const dial = normalizeDialColor(w.dial_color)
    const size = sizeBand(w.case_diameter_mm)
    const value = values.get(w.id) ?? null
    return {
      id: w.id,
      name: `${w.brand?.name ?? ""} ${w.model}`.trim(),
      nickname: w.nickname,
      thumbUrl: w.cover_thumb_url ?? w.cover_photo_url,
      photoUrl: w.cover_photo_url,
      brandId: w.brand_id,
      brandName: w.brand?.name ?? "",
      categoryId: w.category?.id ?? null,
      categoryName: w.category?.name ?? null,
      functionKey: deriveFunction({
        categoryName: w.category?.name ?? null,
        complication: w.complication,
        rotatingBezel: w.rotating_bezel,
        waterResistanceM: w.water_resistance_m,
      }),
      dialKey: dial.key,
      dialLabel: dial.label,
      sizeKey: size.key,
      sizeLabel: size.label,
      material: w.case_material,
      attachment: w.attachment,
      replaceability: w.replaceability ?? null,
      sentimental: w.sentimental ?? false,
      keepDecision: w.keep_decision ?? null,
      saleStatus: w.sale_status,
      isComingSoon: w.is_coming_soon,
      guide: guides[w.id] ?? null,
      valueCents: value?.cents ?? null,
      valueSource: value?.source ?? null,
      recentWears: recentByWatch.get(w.id) ?? 0,
      feels: feelsByWatch.get(w.id) ?? [],
      lastWorn: lastByWatch.get(w.id) ?? null,
    }
  })

  const faceoffs: Faceoff[] = (
    (faceoffRes.data ?? []) as Array<{ id: string; winner_id: string; loser_id: string; created_at: string }>
  ).map((f) => ({ id: f.id, winnerId: f.winner_id, loserId: f.loser_id, createdAt: f.created_at }))

  return {
    watches,
    faceoffs,
    coverage: {
      daysLogged: loggedDays.size,
      wearsInWindow,
      historyDays: firstWear ? daysBetween(firstWear, today) : 0,
    },
  }
}

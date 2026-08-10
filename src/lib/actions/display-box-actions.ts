"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getWatches } from "@/lib/queries/watches"
import { getTierBands } from "@/lib/queries/tier-config"
import { tierBandForCents, tierIndexFor } from "@/lib/tiers"
import {
  selectDisplayBox,
  DISPLAY_BOX_SIZE,
  type DisplayBoxCandidate,
} from "@/lib/display-box"

export type DisplayBoxActionState = { error?: string; success?: boolean }

/**
 * Assemble a fresh display box from the deterministic engine and persist it
 * (history is kept). Also used to "regenerate".
 */
export async function createDisplayBox(): Promise<DisplayBoxActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "You must be signed in." }

  const [watches, tierBands] = await Promise.all([getWatches(), getTierBands()])
  const owned = watches.filter((w) => !w.is_wishlist && !w.is_coming_soon)
  if (owned.length === 0) return { error: "No owned watches to choose from." }

  // Previous box (most recent) → deprioritize its watches so the box rotates.
  const previousBoxIds = new Set<string>()
  const { data: prevBox } = await supabase
    .from("display_boxes")
    .select("id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (prevBox) {
    const { data: prevItems } = await supabase
      .from("display_box_watches")
      .select("watch_id")
      .eq("box_id", prevBox.id)
    for (const it of (prevItems ?? []) as { watch_id: string }[]) {
      previousBoxIds.add(it.watch_id)
    }
  }

  const candidates: DisplayBoxCandidate[] = owned.map((w) => ({
    id: w.id,
    name: `${w.brand?.name ?? ""} ${w.model}`.trim(),
    brandId: w.brand_id ?? null,
    categoryId: w.category_id,
    categoryName: w.category?.name ?? null,
    tierLabel: tierBandForCents(w.purchase_price_cents, tierBands).label,
    tierIndex: tierIndexFor(w.purchase_price_cents, tierBands),
    complications: (w.complication ?? "")
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean),
    rotatingBezel: w.rotating_bezel ?? false,
    waterResistanceM: w.water_resistance_m ?? null,
    wearCount: w.wear_count ?? 0,
    lastWornDate: w.last_worn_date ?? null,
    purchaseDate: w.purchase_date ?? null,
    box: w.box ?? null,
  }))

  const todayIso = new Date().toISOString().slice(0, 10)
  const picks = selectDisplayBox(candidates, {
    size: DISPLAY_BOX_SIZE,
    previousBoxIds,
    todayIso,
    tierCount: tierBands.length,
  })
  if (picks.length === 0) return { error: "Could not assemble a display box." }

  const { data: newBox, error: boxErr } = await supabase
    .from("display_boxes")
    .insert({ user_id: user.id, method: "algorithm" })
    .select("id")
    .single()
  if (boxErr || !newBox) return { error: boxErr?.message ?? "Failed to create the box." }

  const rows = picks.map((p, i) => ({
    box_id: newBox.id,
    watch_id: p.id,
    position: i + 1,
    reason: p.reason,
  }))
  const { error: itemsErr } = await supabase.from("display_box_watches").insert(rows)
  if (itemsErr) return { error: itemsErr.message }

  revalidatePath("/wear-log")
  revalidatePath("/dashboard")
  return { success: true }
}

/**
 * Mark a watch as the one currently being worn from the current display box
 * (single-select: this clears any previously-worn watch). Also logs today's
 * wear, deduped so re-selecting the same day doesn't double-count.
 */
export async function setWearingWatch(watchId: string): Promise<DisplayBoxActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "You must be signed in." }

  const { data: box } = await supabase
    .from("display_boxes")
    .select("id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!box) return { error: "No display box yet." }

  const { error: upErr } = await supabase
    .from("display_boxes")
    .update({ wearing_watch_id: watchId })
    .eq("id", box.id)
    .eq("user_id", user.id)
  if (upErr) return { error: upErr.message }

  // Log today's wear, but only once per watch per day.
  const today = new Date().toISOString().slice(0, 10)
  const { data: existing } = await supabase
    .from("wear_logs")
    .select("id")
    .eq("user_id", user.id)
    .eq("watch_id", watchId)
    .eq("worn_date", today)
    .limit(1)
  if (!existing || existing.length === 0) {
    const { error: insErr } = await supabase
      .from("wear_logs")
      .insert({ user_id: user.id, watch_id: watchId, worn_date: today })
    if (insErr) return { error: insErr.message }
  }

  revalidatePath("/dashboard")
  revalidatePath("/wear-log")
  return { success: true }
}

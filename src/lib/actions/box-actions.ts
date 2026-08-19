"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import {
  normalizeBoxConfig,
  boxOptions,
  type AutoFillMove,
  type AutoFillPlan,
} from "@/lib/boxes"
import { getBoxConfig } from "@/lib/queries/box-config"
import { getWatches } from "@/lib/queries/watches"
import { getTierBands } from "@/lib/queries/tier-config"
import { tierBandForCents, tierIndexFor } from "@/lib/tiers"
import {
  selectDisplayBox,
  DISPLAY_BOX_SIZE,
  type DisplayBoxCandidate,
} from "@/lib/display-box"
import type { TierBand } from "@/lib/tiers"
import type { WatchWithCover } from "@/lib/types/watch"

export async function saveBoxConfig(
  count: number,
  descriptions: Record<string, string>
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "You must be signed in." }

  // Carry the last auto-fill forward: it is stored on the same JSONB blob, and
  // renaming a description must not throw away the list of watches you still
  // have to physically move.
  const existing = await getBoxConfig()
  const config = {
    ...normalizeBoxConfig({ count, descriptions }),
    lastAutoFill: existing.lastAutoFill,
  }

  const { error } = await supabase
    .from("profiles")
    .update({ box_config: config })
    .eq("id", user.id)
  if (error) return { error: error.message }

  revalidatePath("/config")
  revalidatePath("/collection")
  revalidatePath("/reports/box")
  revalidatePath("/dashboard")
  return { success: true }
}

/**
 * Work out an auto-fill WITHOUT touching a single watch.
 *
 * A fill rewrites the box number on up to a dozen watches and empties a box on
 * the way — a change you then have to reproduce physically on a shelf, and one
 * with no undo. So it gets a look before it gets a write: this returns the
 * whole plan, the panel shows it, and nothing moves until Build is pressed.
 *
 * The engine itself is what became of the weekly "Display Box". The special
 * box is gone; the algorithm that made it interesting is not. It balances
 * category, price tier and complication, favours under-worn and newer pieces,
 * keeps 3–4 gym-capable and 1–2 swim-ready watches, caps luxury at two, and
 * refuses to pair two watches of the same brand.
 */
export async function planBoxAutoFill(
  box: string
): Promise<{ error?: string; plan?: AutoFillPlan }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "You must be signed in." }

  const [config, watches, tierBands] = await Promise.all([
    getBoxConfig(),
    getWatches(),
    getTierBands(),
  ])

  if (!boxOptions(config.count).includes(box)) {
    return { error: `${box} is not one of your configured boxes.` }
  }

  const owned = ownedWatches(watches)
  if (owned.length === 0) return { error: "No owned watches to choose from." }

  // The watches currently in the box are what the engine rotates AWAY from —
  // the same role last week's box played for the weekly rotation.
  const previousIds = new Set(owned.filter((w) => w.box === box).map((w) => w.id))

  const picks = selectDisplayBox(toCandidates(owned, tierBands), {
    size: DISPLAY_BOX_SIZE,
    previousBoxIds: previousIds,
    todayIso: new Date().toISOString().slice(0, 10),
    tierCount: tierBands.length,
  })
  if (picks.length === 0) return { error: "Could not assemble a box." }

  const byId = new Map(owned.map((w) => [w.id, w]))
  const nameOf = (id: string) => {
    const w = byId.get(id)
    return `${w?.brand?.name ?? ""} ${w?.model ?? ""}`.trim() || "Unknown watch"
  }
  const pickIds = new Set(picks.map((p) => p.id))

  return {
    plan: {
      box,
      incoming: picks
        .filter((p) => !previousIds.has(p.id))
        .map((p) => ({
          watchId: p.id,
          name: nameOf(p.id),
          previousBox: byId.get(p.id)?.box ?? null,
          reason: p.reason,
        })),
      staying: picks
        .filter((p) => previousIds.has(p.id))
        .map((p) => ({ watchId: p.id, name: nameOf(p.id), previousBox: box })),
      outgoing: [...previousIds]
        .filter((id) => !pickIds.has(id))
        .map((id) => ({ watchId: id, name: nameOf(id), previousBox: box })),
    },
  }
}

/**
 * Apply a plan: the box ends up holding exactly `watchIds` and nothing else.
 *
 * Takes the ids explicitly rather than re-running the engine, so what the user
 * approved is exactly what gets written. Re-running would be almost always
 * identical and occasionally not — a wear logged between preview and press
 * would be enough — and "almost always" is not good enough for a confirmation
 * step.
 */
export async function commitBoxAutoFill(
  box: string,
  watchIds: string[]
): Promise<{ error?: string; success?: boolean; assigned?: number }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "You must be signed in." }

  const [config, watches] = await Promise.all([getBoxConfig(), getWatches()])

  if (!boxOptions(config.count).includes(box)) {
    return { error: `${box} is not one of your configured boxes.` }
  }

  // Only ever assign watches that are still owned and still exist — the plan
  // may have been sitting on screen for a while.
  const owned = ownedWatches(watches)
  const byId = new Map(owned.map((w) => [w.id, w]))
  const targets = watchIds.filter((id) => byId.has(id))
  if (targets.length === 0) {
    return { error: "None of those watches are available any more." }
  }

  const nameOf = (id: string) => {
    const w = byId.get(id)
    return `${w?.brand?.name ?? ""} ${w?.model ?? ""}`.trim() || "Unknown watch"
  }

  // Read where everything was BEFORE the write, or the record would say every
  // watch came from the box it is now in.
  const previousIds = owned.filter((w) => w.box === box).map((w) => w.id)
  const targetSet = new Set(targets)
  const moves: AutoFillMove[] = targets.map((id) => ({
    watchId: id,
    name: nameOf(id),
    previousBox: byId.get(id)?.box ?? null,
  }))
  const removed: AutoFillMove[] = previousIds
    .filter((id) => !targetSet.has(id))
    .map((id) => ({ watchId: id, name: nameOf(id), previousBox: box }))

  // Clear first, then assign — so a watch that is both currently in the box
  // and picked again cannot be left cleared by ordering.
  if (previousIds.length > 0) {
    const { error: clearErr } = await supabase
      .from("watches")
      .update({ box: null })
      .eq("user_id", user.id)
      .eq("box", box)
    if (clearErr) return { error: clearErr.message }
  }

  const { error: assignErr } = await supabase
    .from("watches")
    .update({ box })
    .eq("user_id", user.id)
    .in("id", targets)
  if (assignErr) return { error: assignErr.message }

  const { error: cfgErr } = await supabase
    .from("profiles")
    .update({
      box_config: {
        ...config,
        lastAutoFill: { box, at: new Date().toISOString(), moves, removed },
      },
    })
    .eq("id", user.id)

  revalidatePath("/config")
  revalidatePath("/collection")
  revalidatePath("/reports/box")
  revalidatePath("/dashboard")

  // A failed bookkeeping write must not read as a failed fill — the watches
  // moved either way, and the list is a convenience.
  if (cfgErr) return { success: true, assigned: targets.length }
  return { success: true, assigned: targets.length }
}

/** Sold watches are history and wish-list / coming-soon watches are not yours
 *  to shelve, so neither can be picked. */
function ownedWatches(watches: WatchWithCover[]): WatchWithCover[] {
  return watches.filter(
    (w) => !w.is_wishlist && !w.is_coming_soon && w.sale_status !== "sold"
  )
}

function toCandidates(
  owned: WatchWithCover[],
  tierBands: TierBand[]
): DisplayBoxCandidate[] {
  return owned.map((w) => ({
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
}

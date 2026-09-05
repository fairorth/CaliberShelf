"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import {
  MAX_VALUATION_PCT,
  MIN_VALUATION_PCT,
  normalizeTierConfig,
  type TierConfigRow,
} from "@/lib/tiers"
import { refreshTierValuations } from "@/lib/actions/tier-valuations"

const configSchema = z
  .array(
    z.object({
      label: z.string().max(40),
      max: z.number().positive().nullable(),
      valuationPct: z
        .number()
        .min(MIN_VALUATION_PCT, "A valuation percentage cannot be negative.")
        .max(MAX_VALUATION_PCT, `Cap on valuation percentage is ${MAX_VALUATION_PCT}%.`),
    })
  )
  .min(2, "Keep at least two tiers.")
  .max(12, "That's a lot of tiers — cap is 12.")

export async function saveTierConfig(
  config: TierConfigRow[]
): Promise<{ error?: string; success?: boolean; valued?: number; warning?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "You must be signed in." }

  const parsed = configSchema.safeParse(config)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const rows = normalizeTierConfig(parsed.data)

  // Every non-top tier needs a positive upper bound, strictly ascending.
  let prev = 0
  for (let i = 0; i < rows.length - 1; i++) {
    const m = rows[i].max
    if (m == null || m <= prev) {
      return {
        error: "Each tier's upper bound must be a positive number greater than the tier above it.",
      }
    }
    prev = m
  }

  const { error } = await supabase
    .from("profiles")
    .update({ tier_config: rows })
    .eq("id", user.id)
  if (error) return { error: error.message }

  // The static valuations ARE these percentages — leaving them until someone
  // remembers to press a button would mean the Tiers screen and the portfolio
  // disagreed about the same number. Re-derive them here; the manual button is
  // for the other direction (purchase prices changed, tiers did not).
  const refresh = await refreshTierValuations()

  revalidatePath("/reports/collection-map")
  revalidatePath("/config")
  // The tiers themselves saved; a failed re-derive is worth saying out loud
  // (it is what the "Update static valuations" button retries) but must not be
  // reported as a failed save.
  return { success: true, valued: refresh.valued, warning: refresh.error }
}

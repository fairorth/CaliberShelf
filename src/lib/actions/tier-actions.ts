"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { normalizeTierConfig, type TierConfigRow } from "@/lib/tiers"

const configSchema = z
  .array(
    z.object({
      label: z.string().max(40),
      max: z.number().positive().nullable(),
    })
  )
  .min(2, "Keep at least two tiers.")
  .max(12, "That's a lot of tiers — cap is 12.")

export async function saveTierConfig(
  config: TierConfigRow[]
): Promise<{ error?: string; success?: boolean }> {
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

  revalidatePath("/reports/collection-map")
  revalidatePath("/config")
  return { success: true }
}

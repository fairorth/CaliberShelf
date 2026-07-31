import { createClient } from "@/lib/supabase/server"
import {
  normalizeTierConfig,
  configToBands,
  DEFAULT_TIER_CONFIG,
  type TierConfigRow,
  type TierBand,
} from "@/lib/tiers"

/** The current user's tier config, or the app defaults if none is saved. */
export async function getTierConfig(): Promise<TierConfigRow[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return DEFAULT_TIER_CONFIG

  const { data } = await supabase
    .from("profiles")
    .select("tier_config")
    .eq("id", user.id)
    .maybeSingle()

  if (!data || data.tier_config == null) return DEFAULT_TIER_CONFIG
  return normalizeTierConfig(data.tier_config)
}

/** The current user's tiers resolved to bands (for the reports). */
export async function getTierBands(): Promise<TierBand[]> {
  return configToBands(await getTierConfig())
}

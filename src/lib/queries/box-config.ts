import { createClient } from "@/lib/supabase/server"
import { normalizeBoxConfig, DEFAULT_BOX_COUNT, type BoxConfig } from "@/lib/boxes"

/** The current user's full box config (count + descriptions), or defaults. */
export async function getBoxConfig(): Promise<BoxConfig> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { count: DEFAULT_BOX_COUNT, descriptions: {} }

  const { data } = await supabase
    .from("profiles")
    .select("box_config")
    .eq("id", user.id)
    .maybeSingle()

  if (!data || data.box_config == null) {
    return { count: DEFAULT_BOX_COUNT, descriptions: {} }
  }
  return normalizeBoxConfig(data.box_config)
}

/** The current user's configured box count, or the app default if none saved. */
export async function getBoxCount(): Promise<number> {
  return (await getBoxConfig()).count
}

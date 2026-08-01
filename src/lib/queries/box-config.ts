import { createClient } from "@/lib/supabase/server"
import { normalizeBoxCount, DEFAULT_BOX_COUNT } from "@/lib/boxes"

/** The current user's configured box count, or the app default if none saved. */
export async function getBoxCount(): Promise<number> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return DEFAULT_BOX_COUNT

  const { data } = await supabase
    .from("profiles")
    .select("box_config")
    .eq("id", user.id)
    .maybeSingle()

  if (!data || data.box_config == null) return DEFAULT_BOX_COUNT
  return normalizeBoxCount(data.box_config)
}

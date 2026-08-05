import { createClient } from "@/lib/supabase/server"

/** The user's configured Watch Images parent folder (for the sync script), or "". */
export async function getWatchImagesPath(): Promise<string> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return ""

  const { data } = await supabase
    .from("profiles")
    .select("watch_images_path")
    .eq("id", user.id)
    .maybeSingle()

  return ((data?.watch_images_path as string | null) ?? "").trim()
}

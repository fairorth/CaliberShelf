"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export async function saveWatchImagesPath(
  path: string
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "You must be signed in." }

  const trimmed = path.trim()
  const { error } = await supabase
    .from("profiles")
    .update({ watch_images_path: trimmed || null })
    .eq("id", user.id)
  if (error) return { error: error.message }

  revalidatePath("/config")
  return { success: true }
}

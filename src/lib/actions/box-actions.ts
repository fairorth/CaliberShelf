"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { normalizeBoxCount } from "@/lib/boxes"

export async function saveBoxCount(
  count: number
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "You must be signed in." }

  const n = normalizeBoxCount(count)

  const { error } = await supabase
    .from("profiles")
    .update({ box_config: { count: n } })
    .eq("id", user.id)
  if (error) return { error: error.message }

  revalidatePath("/config")
  revalidatePath("/collection")
  return { success: true }
}

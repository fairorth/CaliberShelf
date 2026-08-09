"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { normalizeBoxConfig } from "@/lib/boxes"

export async function saveBoxConfig(
  count: number,
  descriptions: Record<string, string>
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "You must be signed in." }

  const config = normalizeBoxConfig({ count, descriptions })

  const { error } = await supabase
    .from("profiles")
    .update({ box_config: config })
    .eq("id", user.id)
  if (error) return { error: error.message }

  revalidatePath("/config")
  revalidatePath("/collection")
  revalidatePath("/reports/box")
  return { success: true }
}

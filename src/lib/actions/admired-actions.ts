"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { deleteAdmiredFor, deleteAdmiredPhotoFor, updateAdmiredFor } from "@/lib/admired-store"
import { admiredFieldsSchema } from "@/lib/validations/admired"
import type { AdmiredFields } from "@/lib/validations/admired"

type Result = { success?: true; error?: string }

/** Edit an admired watch from the web (the Monday-morning tidy-up). */
export async function updateAdmired(id: string, fields: AdmiredFields): Promise<Result> {
  const parsed = admiredFieldsSchema.safeParse(fields)
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "You must be logged in." }
  const result = await updateAdmiredFor(supabase, user.id, id, parsed.data)
  if ("error" in result) return { error: result.error }
  revalidatePath("/inspiration")
  return { success: true }
}

export async function deleteAdmired(id: string): Promise<Result> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "You must be logged in." }
  const result = await deleteAdmiredFor(supabase, user.id, id)
  if ("error" in result) return { error: result.error }
  revalidatePath("/inspiration")
  return { success: true }
}

export async function deleteAdmiredPhoto(photoId: string): Promise<Result> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "You must be logged in." }
  const result = await deleteAdmiredPhotoFor(supabase, user.id, photoId)
  if ("error" in result) return { error: result.error }
  revalidatePath("/inspiration")
  return { success: true }
}

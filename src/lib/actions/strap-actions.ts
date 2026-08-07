"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { strapFormSchema } from "@/lib/validations/strap"
import { thumbPathFor } from "@/lib/thumbnails"
import { dollarsToCents } from "@/lib/utils"

const PHOTO_BUCKET = "watch-photos"

export type StrapActionState = {
  error?: string
  success?: boolean
}

/** A watch wears one strap at a time: before mounting a strap on a watch,
 *  dismount whatever else is on it (unique index backstops races). */
async function dismountOtherStraps(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  watchId: string,
  exceptStrapId?: string
) {
  let query = supabase
    .from("straps")
    .update({ current_watch_id: null })
    .eq("user_id", userId)
    .eq("current_watch_id", watchId)
  if (exceptStrapId) query = query.neq("id", exceptStrapId)
  await query
}

function revalidateStrapSurfaces(watchIds: Array<string | null | undefined>) {
  revalidatePath("/straps")
  for (const id of watchIds) {
    if (id) revalidatePath(`/watch/${id}/edit`)
  }
}

/**
 * Create a strap from the form. Redirects to its edit page so photos can be
 * added (form-bound action — throw-based redirect is safe here).
 */
export async function createStrap(
  _prevState: StrapActionState,
  formData: FormData
): Promise<StrapActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "You must be logged in." }
  }

  const raw = Object.fromEntries(formData.entries())
  const parsed = strapFormSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }
  const data = parsed.data

  if (data.current_watch_id) {
    await dismountOtherStraps(supabase, user.id, data.current_watch_id)
  }

  const { data: strap, error } = await supabase
    .from("straps")
    .insert({
      user_id: user.id,
      name: data.name || null,
      manufacturer: data.manufacturer || null,
      material: data.material,
      color: data.color || null,
      width_mm: data.width_mm,
      quick_release: data.quick_release,
      micro_adjust: data.micro_adjust,
      source: data.source || null,
      source_watch_id: data.source_watch_id || null,
      current_watch_id: data.current_watch_id || null,
      purchase_date: data.purchase_date || null,
      purchase_price_cents:
        data.purchase_price !== null ? dollarsToCents(data.purchase_price) : null,
      notes: data.notes || null,
    })
    .select("id")
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidateStrapSurfaces([data.current_watch_id])
  redirect(`/straps/${(strap as { id: string }).id}/edit`)
}

/**
 * Update a strap (form-bound via .bind(null, strapId)).
 */
export async function updateStrap(
  strapId: string,
  _prevState: StrapActionState,
  formData: FormData
): Promise<StrapActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "You must be logged in." }
  }

  const raw = Object.fromEntries(formData.entries())
  const parsed = strapFormSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }
  const data = parsed.data

  // Remember where the strap was mounted so both watches revalidate.
  const { data: before } = await supabase
    .from("straps")
    .select("current_watch_id")
    .eq("id", strapId)
    .eq("user_id", user.id)
    .single()

  if (data.current_watch_id) {
    await dismountOtherStraps(supabase, user.id, data.current_watch_id, strapId)
  }

  const { error } = await supabase
    .from("straps")
    .update({
      name: data.name || null,
      manufacturer: data.manufacturer || null,
      material: data.material,
      color: data.color || null,
      width_mm: data.width_mm,
      quick_release: data.quick_release,
      micro_adjust: data.micro_adjust,
      source: data.source || null,
      source_watch_id: data.source_watch_id || null,
      current_watch_id: data.current_watch_id || null,
      purchase_date: data.purchase_date || null,
      purchase_price_cents:
        data.purchase_price !== null ? dollarsToCents(data.purchase_price) : null,
      notes: data.notes || null,
    })
    .eq("id", strapId)
    .eq("user_id", user.id)

  if (error) {
    return { error: error.message }
  }

  revalidateStrapSurfaces([
    data.current_watch_id,
    (before as { current_watch_id: string | null } | null)?.current_watch_id,
  ])
  revalidatePath(`/straps/${strapId}/edit`)
  redirect("/straps")
}

/**
 * Delete a strap and its photos (storage + rows via cascade).
 */
export async function deleteStrap(strapId: string): Promise<StrapActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "You must be logged in." }
  }

  const { data: strap } = await supabase
    .from("straps")
    .select("current_watch_id")
    .eq("id", strapId)
    .eq("user_id", user.id)
    .single()

  const { data: photos } = await supabase
    .from("strap_photos")
    .select("storage_path, thumb_path")
    .eq("strap_id", strapId)
    .eq("user_id", user.id)

  if (photos && photos.length > 0) {
    const paths = (photos as Array<{ storage_path: string; thumb_path: string | null }>).flatMap(
      (p) => [p.storage_path, p.thumb_path ?? thumbPathFor(p.storage_path)]
    )
    await supabase.storage.from(PHOTO_BUCKET).remove(paths)
  }

  const { error } = await supabase
    .from("straps")
    .delete()
    .eq("id", strapId)
    .eq("user_id", user.id)

  if (error) {
    return { error: error.message }
  }

  revalidateStrapSurfaces([
    (strap as { current_watch_id: string | null } | null)?.current_watch_id,
  ])
  redirect("/straps")
}

/**
 * Mount a strap on a watch (or dismount with strapId = null). Direct-call
 * action used by the watch page's strap panel.
 */
export async function setWatchStrap(
  watchId: string,
  strapId: string | null
): Promise<StrapActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "You must be logged in." }
  }

  await dismountOtherStraps(supabase, user.id, watchId, strapId ?? undefined)

  if (strapId) {
    const { error } = await supabase
      .from("straps")
      .update({ current_watch_id: watchId })
      .eq("id", strapId)
      .eq("user_id", user.id)
    if (error) {
      return { error: error.message }
    }
  }

  revalidateStrapSurfaces([watchId])
  return { success: true }
}

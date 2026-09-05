"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { watchFormSchema, quickAddSchema } from "@/lib/validations/watch"
import { setWatchLabels } from "@/lib/actions/label-actions"
import { syncTierValuation } from "@/lib/actions/tier-valuations"
import { buildStoragePath } from "@/lib/storage"
import { generateThumbnail, thumbPathFor } from "@/lib/thumbnails"
import { dollarsToCents } from "@/lib/utils"

export type WatchActionState = {
  error?: string
  success?: boolean
  /** Set by imperatively-called actions so the client can navigate (see
   *  createWatchWithPhoto) instead of relying on a throw-based redirect(). */
  redirectTo?: string
}

/**
 * A wish-list BRAND means "we own nothing from them yet". Saving a watch that
 * is owned or coming soon (i.e. not a wish-list watch) fulfils that wish, so
 * the brand tag clears. Saving a wish-list WATCH leaves the brand tag alone.
 * Idempotent unconditional update — cheap, and a no-op for non-tagged brands.
 */
async function clearBrandWishlist(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  brandId: string,
  watchIsWishlist: boolean
) {
  if (watchIsWishlist) return
  const { error } = await supabase
    .from("brands")
    .update({ is_wishlist: false })
    .eq("id", brandId)
    .eq("user_id", userId)
    .eq("is_wishlist", true)
  if (error) {
    // Non-fatal: the watch save already succeeded.
    console.error("Failed to clear brand wish-list tag:", error.message)
  } else {
    revalidatePath("/config")
    revalidatePath("/reports/brand-wishlist")
  }
}

/**
 * Create a new watch. Redirects to the watch detail page on success.
 */
export async function createWatch(
  _prevState: WatchActionState,
  formData: FormData
): Promise<WatchActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "You must be logged in to add a watch." }
  }

  const raw = Object.fromEntries(formData.entries())
  const parsed = watchFormSchema.safeParse(raw)

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const data = parsed.data

  const { data: watch, error } = await supabase
    .from("watches")
    .insert({
      user_id: user.id,
      brand_id: data.brand_id,
      model: data.model,
      reference_number: data.reference_number || null,
      reference_unverified: data.reference_number
        ? data.reference_unverified
        : false,
      serial_number: data.serial_number || null,
      nickname: data.nickname || null,
      movement_id: data.movement_id || null,
      category_id: data.category_id,
      case_material: data.case_material || null,
      case_diameter_mm: data.case_diameter_mm,
      strap_width_mm: data.strap_width_mm,
      lug_to_lug_mm: data.lug_to_lug_mm,
      case_height_mm: data.case_height_mm,
      weight_g: data.weight_g,
      case_shape: data.case_shape || null,
      rotating_bezel: data.rotating_bezel,
      crystal: data.crystal || null,
      water_resistance_m: data.water_resistance_m,
      dial_color: data.dial_color || null,
      complication: data.complication || null,
      purchase_date: data.purchase_date || null,
      purchase_price_cents: data.purchase_price !== null
        ? dollarsToCents(data.purchase_price)
        : null,
      purchase_currency: data.purchase_currency,
      acq_shipping_cents: data.acq_shipping !== null ? dollarsToCents(data.acq_shipping) : null,
      acq_tax_cents: data.acq_tax !== null ? dollarsToCents(data.acq_tax) : null,
      acq_duty_cents: data.acq_duty !== null ? dollarsToCents(data.acq_duty) : null,
      target_ask_cents: data.target_ask !== null ? dollarsToCents(data.target_ask) : null,
      notes: data.notes || null,
      box: data.box || null,
      attachment: data.attachment || null,
      is_coming_soon: data.is_coming_soon,
      is_wishlist: data.is_wishlist,
      price_check_enabled: data.price_check_enabled,
    })
    .select("id")
    .single()

  if (error) {
    return { error: error.message }
  }

  // Sync labels
  if (data.label_ids.length > 0) {
    await setWatchLabels(watch.id, data.label_ids)
  }

  await clearBrandWishlist(supabase, user.id, data.brand_id, data.is_wishlist)
  // A new watch is valued the moment it exists: untracked ones get their
  // tier's static estimate, so nothing sits in the collection with no value.
  await syncTierValuation(watch.id)

  revalidatePath("/dashboard")
  redirect(`/watch/${watch.id}/edit`)
}

/**
 * Update an existing watch. Redirects to the watch detail page on success.
 */
export async function updateWatch(
  watchId: string,
  returnTo: string,
  _prevState: WatchActionState,
  formData: FormData
): Promise<WatchActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "You must be logged in to edit a watch." }
  }

  const raw = Object.fromEntries(formData.entries())
  const parsed = watchFormSchema.safeParse(raw)

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const data = parsed.data

  const { error } = await supabase
    .from("watches")
    .update({
      brand_id: data.brand_id,
      model: data.model,
      reference_number: data.reference_number || null,
      // No reference = nothing to verify
      reference_unverified: data.reference_number
        ? data.reference_unverified
        : false,
      serial_number: data.serial_number || null,
      nickname: data.nickname || null,
      movement_id: data.movement_id || null,
      category_id: data.category_id,
      case_material: data.case_material || null,
      case_diameter_mm: data.case_diameter_mm,
      strap_width_mm: data.strap_width_mm,
      lug_to_lug_mm: data.lug_to_lug_mm,
      case_height_mm: data.case_height_mm,
      weight_g: data.weight_g,
      case_shape: data.case_shape || null,
      rotating_bezel: data.rotating_bezel,
      crystal: data.crystal || null,
      water_resistance_m: data.water_resistance_m,
      dial_color: data.dial_color || null,
      complication: data.complication || null,
      purchase_date: data.purchase_date || null,
      purchase_price_cents: data.purchase_price !== null
        ? dollarsToCents(data.purchase_price)
        : null,
      purchase_currency: data.purchase_currency,
      acq_shipping_cents: data.acq_shipping !== null ? dollarsToCents(data.acq_shipping) : null,
      acq_tax_cents: data.acq_tax !== null ? dollarsToCents(data.acq_tax) : null,
      acq_duty_cents: data.acq_duty !== null ? dollarsToCents(data.acq_duty) : null,
      target_ask_cents: data.target_ask !== null ? dollarsToCents(data.target_ask) : null,
      notes: data.notes || null,
      box: data.box || null,
      attachment: data.attachment || null,
      is_coming_soon: data.is_coming_soon,
      is_wishlist: data.is_wishlist,
      price_check_enabled: data.price_check_enabled,
    })
    .eq("id", watchId)
    .eq("user_id", user.id) // extra safety on top of RLS

  if (error) {
    return { error: error.message }
  }

  // Sync labels
  await setWatchLabels(watchId, data.label_ids)

  await clearBrandWishlist(supabase, user.id, data.brand_id, data.is_wishlist)
  // Purchase price, wish-list status and price tracking all move the static
  // valuation — re-derive it rather than leave yesterday's number behind.
  await syncTierValuation(watchId)

  revalidatePath("/dashboard")
  revalidatePath("/collection")
  revalidatePath(`/watch/${watchId}`); revalidatePath(`/watch/${watchId}/edit`)
  // Return to wherever the user came from (e.g. the Attention Needed report).
  // Only allow internal paths — never an off-site (open-redirect) target.
  const dest =
    returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//")
      ? returnTo
      : "/collection"
  redirect(dest)
}

// `updateDialFraming` is gone (Phase 9 §1.2). It was the only writer of
// `dial_focal_x/y` and `dial_zoom`; the columns stay and their existing values
// are untouched, so if the automatic nearest-1:1 rule disappoints the data is
// still there to fall back on. Drop them a phase later, after living with it.

/**
 * Delete a watch and all associated photos from storage.
 */
export async function deleteWatch(watchId: string): Promise<WatchActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "You must be logged in to delete a watch." }
  }

  // First, get all photo storage paths so we can clean up storage
  const { data: photos } = await supabase
    .from("watch_photos")
    .select("storage_path, thumb_path")
    .eq("watch_id", watchId)
    .eq("user_id", user.id)

  // Delete photos (originals + thumbnails) from storage bucket
  if (photos && photos.length > 0) {
    const paths = photos.flatMap((p: { storage_path: string; thumb_path: string | null }) => [
      p.storage_path,
      p.thumb_path ?? thumbPathFor(p.storage_path),
    ])
    await supabase.storage.from("watch-photos").remove(paths)
  }

  // Delete the watch (cascades to watch_photos and watch_labels rows)
  const { error } = await supabase
    .from("watches")
    .delete()
    .eq("id", watchId)
    .eq("user_id", user.id) // extra safety on top of RLS

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/dashboard")
  revalidatePath("/collection")
  redirect("/collection")
}

/**
 * Bulk delete watches and all associated photos from storage.
 */
export async function bulkDeleteWatches(
  watchIds: string[]
): Promise<WatchActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "You must be logged in." }
  }

  if (watchIds.length === 0) {
    return { error: "No watches selected." }
  }

  // Get all photo storage paths for these watches
  const { data: photos } = await supabase
    .from("watch_photos")
    .select("storage_path, thumb_path")
    .in("watch_id", watchIds)
    .eq("user_id", user.id)

  // Delete photos (originals + thumbnails) from storage bucket
  if (photos && photos.length > 0) {
    const paths = photos.flatMap((p: { storage_path: string; thumb_path: string | null }) => [
      p.storage_path,
      p.thumb_path ?? thumbPathFor(p.storage_path),
    ])
    await supabase.storage.from("watch-photos").remove(paths)
  }

  // Delete the watches (cascades to watch_photos, watch_labels, wear_logs)
  const { error } = await supabase
    .from("watches")
    .delete()
    .in("id", watchIds)
    .eq("user_id", user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/dashboard")
  revalidatePath("/collection")
  return { success: true }
}

const PHOTO_BUCKET = "watch-photos"
const PHOTO_MAX_SIZE = 10 * 1024 * 1024 // 10MB
const PHOTO_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"]

/**
 * Create a watch with an optional photo in one action.
 * Used by the camera-first "Add Watch" mobile flow.
 */
export async function createWatchWithPhoto(
  formData: FormData
): Promise<WatchActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "You must be logged in to add a watch." }
  }

  // Parse form fields (minimal schema)
  const raw = Object.fromEntries(formData.entries())
  const parsed = quickAddSchema.safeParse(raw)

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const data = parsed.data

  // Post-create destination (F3): "Save watch" lands on the watch page;
  // "Save and add another" returns to a fresh quick-add form.
  const destination =
    formData.get("redirect_to") === "another" ? `/add` : `/watch/__ID__`

  // Insert the watch
  const { data: watch, error } = await supabase
    .from("watches")
    .insert({
      user_id: user.id,
      brand_id: data.brand_id,
      model: data.model,
      category_id: data.category_id,
      purchase_price_cents: data.purchase_price !== null
        ? dollarsToCents(data.purchase_price)
        : null,
      is_coming_soon: data.is_coming_soon,
      is_wishlist: data.is_wishlist,
    })
    .select("id")
    .single()

  if (error) {
    return { error: error.message }
  }

  const target = destination.replace("__ID__", watch.id)

  // Handle photo upload if present. Skip silently if it's too large — the watch
  // is already created and we still navigate to it below.
  const photo = formData.get("photo") as File | null
  if (photo && photo.size > 0 && photo.size <= PHOTO_MAX_SIZE) {
    if (PHOTO_ALLOWED_TYPES.includes(photo.type)) {
      const ext = photo.name.split(".").pop() ?? "jpg"
      const uniqueName = `${crypto.randomUUID()}.${ext}`
      const storagePath = buildStoragePath(user.id, watch.id, uniqueName)

      const { error: uploadError } = await supabase.storage
        .from(PHOTO_BUCKET)
        .upload(storagePath, photo, {
          contentType: photo.type,
          upsert: false,
        })

      if (!uploadError) {
        const thumbPath = await generateThumbnail(supabase, storagePath, await photo.arrayBuffer())
        await supabase.from("watch_photos").insert({
          watch_id: watch.id,
          user_id: user.id,
          storage_path: storagePath,
          thumb_path: thumbPath,
          display_order: 0,
          is_cover: true,
        })
      }
    }
  }

  await clearBrandWishlist(supabase, user.id, data.brand_id, data.is_wishlist)
  await syncTierValuation(watch.id)

  revalidatePath("/dashboard")
  // Return the destination instead of calling redirect(). This action is invoked
  // imperatively from a client try/catch, and redirect() works by THROWING a
  // NEXT_REDIRECT error — which that catch grabs and shows as a bogus failure
  // (seen on iOS PWA, where navigation lags the throw). The client navigates.
  return { success: true, redirectTo: target }
}

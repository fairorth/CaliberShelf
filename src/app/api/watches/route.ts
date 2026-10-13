import { NextResponse } from "next/server"
import { getRequestAuth } from "@/lib/supabase/request"
import { createWatchFor, ensureBrandFor } from "@/lib/watch-create"
import { phoneAddWatchSchema } from "@/lib/validations/phone-watch"
import type { PhoneAddWatchResponse } from "@/lib/validations/phone-watch"

/**
 * POST /api/watches — the iPhone app's "Add a watch". JSON (contract:
 * validations/phone-watch.ts). Same create as the web's quick add, via
 * lib/watch-create.ts: first photo becomes the cover, the brand's wish-list
 * tag clears for an owned watch, and the static valuation is written.
 */
export async function POST(request: Request) {
  const { supabase, user } = await getRequestAuth(request)
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parsed = phoneAddWatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }
  const d = parsed.data

  let brandId = d.brand_id
  if (!brandId && d.new_brand_name) {
    const brand = await ensureBrandFor(supabase, user.id, d.new_brand_name)
    if ("error" in brand) return NextResponse.json({ error: brand.error }, { status: 400 })
    brandId = brand.id
  }
  if (!brandId) return NextResponse.json({ error: "Brand is required" }, { status: 400 })

  let photo: File | null = null
  if (d.image_base64) {
    const type = d.media_type ?? "image/jpeg"
    const ext = type.split("/")[1] === "jpeg" ? "jpg" : (type.split("/")[1] ?? "jpg")
    photo = new File([Buffer.from(d.image_base64, "base64")], `phone.${ext}`, { type })
  }

  const created = await createWatchFor(
    supabase,
    user.id,
    {
      brand_id: brandId,
      model: d.model,
      category_id: d.category_id,
      purchase_price_cents: d.purchase_price_cents ?? null,
      is_coming_soon: d.ownership === "coming",
      is_wishlist: d.ownership === "wish",
      reference_number: d.reference_number ?? null,
      reference_unverified: d.reference_unverified,
      box: d.ownership === "wish" ? null : (d.box ?? null),
      // A wish-list watch hasn't been bought, so it has no purchase date.
      purchase_date: d.ownership === "wish" ? null : (d.purchase_date ?? null),
    },
    photo
  )
  if ("error" in created) {
    return NextResponse.json({ error: created.error }, { status: 400 })
  }

  const payload: PhoneAddWatchResponse = created.photoError
    ? { watchId: created.watchId, photoError: created.photoError }
    : { watchId: created.watchId }
  return NextResponse.json(payload, { status: 201 })
}

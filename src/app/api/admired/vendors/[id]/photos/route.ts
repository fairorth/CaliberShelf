import { NextResponse } from "next/server"
import { NOT_FOUND_VENDOR, readVendorNameFor, storeVendorPhotoFor } from "@/lib/admired-store"
import { getRequestAuth } from "@/lib/supabase/request"
import { admiredPhotoUploadSchema, isVendorKind } from "@/lib/validations/admired"
import type { AdmiredPhotoResponse } from "@/lib/validations/admired"

// A name read is one short vision call, like a placard's.
export const maxDuration = 60

/**
 * POST /api/admired/vendors/:id/photos — one BOOTH or NAME frame. A Name frame
 * is read here, on the server, so a frame that sat in the phone's offline
 * queue is still read when it lands; the read sets the vendor's name only if
 * it is still empty. A retried frame (same client id) is stored once and
 * never read twice.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: vendorId } = await params
  const { supabase, user } = await getRequestAuth(request)
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 })

  const parsed = admiredPhotoUploadSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 })
  }
  const d = parsed.data
  if (!isVendorKind(d.kind)) {
    return NextResponse.json({ error: "Watch frames go to /api/admired/:id/photos." }, { status: 422 })
  }

  const stored = await storeVendorPhotoFor(supabase, user.id, vendorId, {
    id: d.id,
    kind: d.kind,
    bytes: Buffer.from(d.image_base64, "base64"),
    mediaType: d.media_type,
    displayOrder: d.display_order,
  })
  if ("error" in stored) {
    // 404 = the vendor's create hasn't landed yet; 500 = storage/DB trouble.
    // Both are RETRIED by the phone's queue; only 422 makes it give up.
    const status = stored.error === NOT_FOUND_VENDOR ? 404 : 500
    return NextResponse.json({ error: stored.error }, { status })
  }

  const payload: AdmiredPhotoResponse = { photoId: stored.photoId }
  if (d.kind === "name" && !stored.duplicate) {
    const read = await readVendorNameFor(supabase, user.id, vendorId, d.image_base64, d.media_type)
    if ("error" in read) payload.vendorNameError = read.error
    else payload.vendorName = read
  }
  return NextResponse.json(payload, { status: 201 })
}

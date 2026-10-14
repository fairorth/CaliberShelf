import { NextResponse } from "next/server"
import { readPlacardFor, storeAdmiredPhotoFor } from "@/lib/admired-store"
import { getRequestAuth } from "@/lib/supabase/request"
import { admiredPhotoUploadSchema } from "@/lib/validations/admired"
import type { AdmiredPhotoResponse } from "@/lib/validations/admired"

// A placard read is one short vision call; keep headroom over identify's.
export const maxDuration = 60

/**
 * POST /api/admired/:id/photos — one frame (base64 JSON, like the other phone
 * uploads). A PLACARD frame is read here, on the server, so a frame that sat
 * in the phone's offline queue all afternoon is still read when it lands; the
 * read fills only the admired watch's empty fields. A retried frame
 * (same client id) is stored once and never read twice.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: admiredId } = await params
  const { supabase, user } = await getRequestAuth(request)
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 })

  const parsed = admiredPhotoUploadSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 })
  }
  const d = parsed.data

  const stored = await storeAdmiredPhotoFor(supabase, user.id, admiredId, {
    id: d.id,
    kind: d.kind,
    bytes: Buffer.from(d.image_base64, "base64"),
    mediaType: d.media_type,
    displayOrder: d.display_order,
  })
  if ("error" in stored) {
    // 404 = the watch's create hasn't landed yet; 500 = storage/DB trouble.
    // Both are RETRIED by the phone's queue; only 422 makes it give up.
    const status = stored.error === "Admired watch not found." ? 404 : 500
    return NextResponse.json({ error: stored.error }, { status })
  }

  const payload: AdmiredPhotoResponse = { photoId: stored.photoId }
  if (d.kind === "placard" && !stored.duplicate) {
    const placard = await readPlacardFor(supabase, user.id, admiredId, d.image_base64, d.media_type)
    if ("error" in placard) payload.placardError = placard.error
    else payload.placard = placard
  }
  return NextResponse.json(payload, { status: 201 })
}

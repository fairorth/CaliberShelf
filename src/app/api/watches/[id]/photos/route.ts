import { NextResponse } from "next/server"
import { getRequestAuth } from "@/lib/supabase/request"
import { storeWatchPhoto } from "@/lib/photo-store"
import { PHOTO_ANGLES } from "@/lib/photo-lab"
import { phonePhotoUploadSchema } from "@/lib/validations/photo-upload"
import type { PhotoAngle } from "@/lib/types/watch"

/**
 * POST /api/watches/:id/photos — the iPhone app's upload. Same storage,
 * thumbnail and dimension work as the web's uploadWatchPhoto, via
 * lib/photo-store.ts. The phone downsizes to ~2000px JPEG first.
 *
 * Two body shapes:
 * - JSON `{ image_base64, media_type, angle? }` — what the phone sends (see
 *   validations/photo-upload.ts for why not multipart).
 * - multipart `photo` + optional `angle` — kept for any other client.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: watchId } = await params
  const { supabase, user } = await getRequestAuth(request)
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 })
  }

  let photo: File
  let angle: PhotoAngle | null = null

  if ((request.headers.get("content-type") ?? "").includes("application/json")) {
    const body = await request.json().catch(() => null)
    const parsed = phonePhotoUploadSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }
    const bytes = Buffer.from(parsed.data.image_base64, "base64")
    const ext = parsed.data.media_type.split("/")[1] ?? "jpg"
    photo = new File([bytes], `phone.${ext === "jpeg" ? "jpg" : ext}`, {
      type: parsed.data.media_type,
    })
    angle = parsed.data.angle ?? null
  } else {
    const form = await request.formData().catch(() => null)
    const part = form?.get("photo")
    if (!(part instanceof File)) {
      return NextResponse.json({ error: "No file selected." }, { status: 400 })
    }
    photo = part
    const rawAngle = form?.get("angle")
    if (typeof rawAngle === "string" && rawAngle !== "") {
      if (!PHOTO_ANGLES.includes(rawAngle as PhotoAngle)) {
        return NextResponse.json({ error: "Unknown angle." }, { status: 400 })
      }
      angle = rawAngle as PhotoAngle
    }
  }

  const result = await storeWatchPhoto(supabase, user.id, watchId, photo, { angle })
  if ("error" in result) {
    const status = result.error === "Watch not found." ? 404 : 400
    return NextResponse.json({ error: result.error }, { status })
  }
  return NextResponse.json({ photoId: result.photoId }, { status: 201 })
}

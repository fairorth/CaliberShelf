import { NextResponse } from "next/server"
import { getRequestAuth } from "@/lib/supabase/request"
import { storeWatchPhoto } from "@/lib/photo-store"
import { PHOTO_ANGLES } from "@/lib/photo-lab"
import type { PhotoAngle } from "@/lib/types/watch"

/**
 * POST /api/watches/:id/photos — the iPhone app's upload (multipart: `photo`,
 * optional `angle`). Same storage, thumbnail and dimension work as the web's
 * uploadWatchPhoto, via lib/photo-store.ts. The phone downsizes to ~2000px
 * JPEG first, which keeps a frame well under the serverless body limit.
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

  const form = await request.formData().catch(() => null)
  const photo = form?.get("photo")
  if (!(photo instanceof File)) {
    return NextResponse.json({ error: "No file selected." }, { status: 400 })
  }

  const rawAngle = form?.get("angle")
  let angle: PhotoAngle | null = null
  if (typeof rawAngle === "string" && rawAngle !== "") {
    if (!PHOTO_ANGLES.includes(rawAngle as PhotoAngle)) {
      return NextResponse.json({ error: "Unknown angle." }, { status: 400 })
    }
    angle = rawAngle as PhotoAngle
  }

  const result = await storeWatchPhoto(supabase, user.id, watchId, photo, { angle })
  if ("error" in result) {
    const status = result.error === "Watch not found." ? 404 : 400
    return NextResponse.json({ error: result.error }, { status })
  }
  return NextResponse.json({ photoId: result.photoId }, { status: 201 })
}

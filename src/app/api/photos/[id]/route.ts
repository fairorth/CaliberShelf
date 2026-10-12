import { NextResponse } from "next/server"
import { getRequestAuth } from "@/lib/supabase/request"
import { removeWatchPhoto } from "@/lib/photo-store"

/**
 * DELETE /api/photos/:id — the iPhone app's per-frame undo. Same work as the
 * web's deleteWatchPhoto (storage original + thumbnail, row, cover promotion),
 * via lib/photo-store.ts.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: photoId } = await params
  const { supabase, user } = await getRequestAuth(request)
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 })
  }

  const result = await removeWatchPhoto(supabase, user.id, photoId)
  if ("error" in result) {
    const status = result.error === "Photo not found." ? 404 : 400
    return NextResponse.json({ error: result.error }, { status })
  }
  return NextResponse.json({ ok: true })
}

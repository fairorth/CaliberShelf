import { NextResponse } from "next/server"
import { deleteAdmiredPhotoFor } from "@/lib/admired-store"
import { getRequestAuth } from "@/lib/supabase/request"

/** DELETE /api/admired/photos/:id — the phone's per-frame undo. */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase, user } = await getRequestAuth(request)
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 })
  const result = await deleteAdmiredPhotoFor(supabase, user.id, id)
  if ("error" in result) {
    const status = result.error === "Photo not found." ? 404 : 400
    return NextResponse.json({ error: result.error }, { status })
  }
  return NextResponse.json({ ok: true })
}

import { NextResponse } from "next/server"
import { deleteAdmiredPhotoFor, moveAdmiredPhotoFor } from "@/lib/admired-store"
import { getRequestAuth } from "@/lib/supabase/request"
import { admiredPhotoMoveSchema } from "@/lib/validations/admired"

// Turning a frame into a Name frame reads it — one short vision call.
export const maxDuration = 60

/**
 * PATCH /api/admired/photos/:id — move a frame to another watch, or change
 * what it is (Watch ↔ Booth ↔ Name). The phone's vendor screen.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase, user } = await getRequestAuth(request)
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 })
  const parsed = admiredPhotoMoveSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 })
  }
  const result = await moveAdmiredPhotoFor(supabase, user.id, id, parsed.data)
  if ("error" in result) {
    const status = result.error === "Photo not found." ? 404 : 500
    return NextResponse.json({ error: result.error }, { status })
  }
  return NextResponse.json(result)
}

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

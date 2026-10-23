import { NextResponse } from "next/server"
import { deleteVendorFor, updateVendorFor } from "@/lib/admired-store"
import { getRequestAuth } from "@/lib/supabase/request"
import { vendorFieldsSchema } from "@/lib/validations/admired"

/** PATCH /api/admired/vendors/:id — rename (the owner's name always wins), notes. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase, user } = await getRequestAuth(request)
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 })

  const parsed = vendorFieldsSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 })
  }
  const result = await updateVendorFor(supabase, user.id, id, parsed.data)
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 500 })
  return NextResponse.json({ ok: true })
}

/** DELETE /api/admired/vendors/:id — the vendor, its watches and every frame. */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase, user } = await getRequestAuth(request)
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 })
  const result = await deleteVendorFor(supabase, user.id, id)
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 500 })
  return NextResponse.json({ ok: true })
}

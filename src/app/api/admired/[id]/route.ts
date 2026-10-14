import { NextResponse } from "next/server"
import { deleteAdmiredFor, updateAdmiredFor } from "@/lib/admired-store"
import { getRequestAuth } from "@/lib/supabase/request"
import { admiredFieldsSchema } from "@/lib/validations/admired"

/** PATCH /api/admired/:id — correct maker, model, notes, tags… (the phone). */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase, user } = await getRequestAuth(request)
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 })

  const parsed = admiredFieldsSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 })
  }
  const result = await updateAdmiredFor(supabase, user.id, id, parsed.data)
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 500 })
  return NextResponse.json({ ok: true })
}

/** DELETE /api/admired/:id — the watch and all of its frames. */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase, user } = await getRequestAuth(request)
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 })
  const result = await deleteAdmiredFor(supabase, user.id, id)
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 500 })
  return NextResponse.json({ ok: true })
}

import { NextResponse } from "next/server"
import { createAdmiredFor } from "@/lib/admired-store"
import { getRequestAuth } from "@/lib/supabase/request"
import { admiredCreateSchema } from "@/lib/validations/admired"

/**
 * POST /api/admired — start an Admired watch (the phone's Show mode). The id
 * comes from the phone so a capture queued offline can be retried: a repeat
 * is treated as already done (lib/admired-store.ts).
 */
export async function POST(request: Request) {
  const { supabase, user } = await getRequestAuth(request)
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 })

  const parsed = admiredCreateSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 })
  }
  const result = await createAdmiredFor(supabase, user.id, parsed.data)
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 500 })
  return NextResponse.json({ id: result.id }, { status: 201 })
}

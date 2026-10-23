import { NextResponse } from "next/server"
import { createVendorFor } from "@/lib/admired-store"
import { getRequestAuth } from "@/lib/supabase/request"
import { vendorCreateSchema } from "@/lib/validations/admired"

/**
 * POST /api/admired/vendors — start a vendor (the phone's Show mode, on the
 * first frame at a booth). The id comes from the phone so a create queued
 * offline can be retried: a repeat is treated as already done.
 */
export async function POST(request: Request) {
  const { supabase, user } = await getRequestAuth(request)
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 })

  const parsed = vendorCreateSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 })
  }
  const result = await createVendorFor(supabase, user.id, parsed.data)
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 500 })
  return NextResponse.json({ id: result.id }, { status: 201 })
}

import { NextResponse } from "next/server"
import { applyKeepFieldsFor } from "@/lib/keep-store"
import { getRequestAuth } from "@/lib/supabase/request"
import { keepFieldsSchema } from "@/lib/validations/watch"

/**
 * POST /api/watches/:id/keep — the iPhone watch card's attachment, keep
 * decision and sentimental. The same write (and timestamps) as the web's
 * setKeepFields, via lib/keep-store.ts. Absent keys untouched; null clears.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase, user } = await getRequestAuth(request)
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 })

  const parsed = keepFieldsSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 })
  }
  const result = await applyKeepFieldsFor(supabase, user.id, id, parsed.data)
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 500 })
  return NextResponse.json({ ok: true })
}

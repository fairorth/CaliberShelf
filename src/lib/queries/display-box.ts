import { createClient } from "@/lib/supabase/server"

export interface DisplayBoxEntry {
  watchId: string
  position: number
  reason: string | null
  name: string // brand + model
  nickname: string | null
  box: string | null // permanent storage box number
  categoryName: string | null
}

export interface CurrentDisplayBox {
  id: string
  method: string
  rationale: string | null
  createdAt: string
  watches: DisplayBoxEntry[]
}

type ItemRow = {
  watch_id: string
  position: number
  reason: string | null
  watches: {
    model: string
    nickname: string | null
    box: string | null
    brands: { name: string } | null
    categories: { name: string } | null
  } | null
}

/** The user's current (most recent) display box, or null if none generated. */
export async function getCurrentDisplayBox(): Promise<CurrentDisplayBox | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: box } = await supabase
    .from("display_boxes")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!box) return null

  const { data: items } = await supabase
    .from("display_box_watches")
    .select("watch_id, position, reason, watches(model, nickname, box, brands(name), categories(name))")
    .eq("box_id", box.id)
    .order("position", { ascending: true })

  const rows = (items ?? []) as unknown as ItemRow[]
  const watches: DisplayBoxEntry[] = rows.map((it) => {
    const w = it.watches
    const brand = w?.brands?.name ?? ""
    return {
      watchId: it.watch_id,
      position: it.position,
      reason: it.reason,
      name: `${brand} ${w?.model ?? ""}`.trim(),
      nickname: w?.nickname ?? null,
      box: w?.box ?? null,
      categoryName: w?.categories?.name ?? null,
    }
  })

  return {
    id: box.id,
    method: box.method,
    rationale: box.rationale,
    createdAt: box.created_at,
    watches,
  }
}

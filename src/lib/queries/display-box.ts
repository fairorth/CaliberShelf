import { createClient } from "@/lib/supabase/server"
import { getSignedUrls } from "@/lib/storage"

export interface DisplayBoxEntry {
  watchId: string
  position: number
  reason: string | null
  name: string // brand + model
  nickname: string | null
  box: string | null // permanent storage box number
  categoryName: string | null
  coverUrl: string | null
  /** Times this watch has been worn since the box was assembled. */
  boxWearCount: number
}

export interface CurrentDisplayBox {
  id: string
  method: string
  rationale: string | null
  createdAt: string
  wearingWatchId: string | null
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
    .select("id, method, rationale, created_at, wearing_watch_id")
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
  const watchIds = rows.map((r) => r.watch_id)

  // Cover photos (prefer thumbnail) → signed URLs.
  const coverByWatch = new Map<string, string>()
  if (watchIds.length > 0) {
    const { data: photos } = await supabase
      .from("watch_photos")
      .select("watch_id, thumb_path, storage_path")
      .in("watch_id", watchIds)
      .eq("is_cover", true)
    const pathByWatch = new Map<string, string>()
    for (const p of (photos ?? []) as {
      watch_id: string
      thumb_path: string | null
      storage_path: string
    }[]) {
      pathByWatch.set(p.watch_id, p.thumb_path ?? p.storage_path)
    }
    const signed = await getSignedUrls([...pathByWatch.values()])
    for (const [wid, path] of pathByWatch) {
      const url = signed.get(path)
      if (url) coverByWatch.set(wid, url)
    }
  }

  // Box wear counts: wears logged on/after the box was assembled.
  const boxDate = box.created_at.slice(0, 10)
  const wearByWatch = new Map<string, number>()
  if (watchIds.length > 0) {
    const { data: wears } = await supabase
      .from("wear_logs")
      .select("watch_id, worn_date")
      .in("watch_id", watchIds)
      .gte("worn_date", boxDate)
    for (const w of (wears ?? []) as { watch_id: string }[]) {
      wearByWatch.set(w.watch_id, (wearByWatch.get(w.watch_id) ?? 0) + 1)
    }
  }

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
      coverUrl: coverByWatch.get(it.watch_id) ?? null,
      boxWearCount: wearByWatch.get(it.watch_id) ?? 0,
    }
  })

  return {
    id: box.id,
    method: box.method,
    rationale: box.rationale,
    createdAt: box.created_at,
    wearingWatchId: box.wearing_watch_id ?? null,
    watches,
  }
}

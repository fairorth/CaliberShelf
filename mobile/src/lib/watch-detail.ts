import type { KeepDecision } from "@/lib/validations/keep"
import type { KeepFields } from "@/lib/validations/watch"
import { API_BASE } from "./config"
import { accessToken, supabase } from "./supabase"

/** What the watch card shows beyond the collection's tile. */
export interface WatchDetail {
  photos: Array<{ id: string; url: string; width: number | null; height: number | null }>
  attachment: "max" | "high" | "medium" | "low" | "none" | null
  keepDecision: KeepDecision | null
  sentimental: boolean
}

const BUCKET = "watch-photos"
/** The card's photo size: big enough for a full-width phone view on a 3×
 *  screen, never the untransformed original (design system: Images). */
const CARD_TRANSFORM = { width: 1200, height: 1200, resize: "contain" as const, quality: 82 }

type PhotoRow = {
  id: string
  storage_path: string
  is_cover: boolean
  sort_order: number | null
  display_order: number
  image_width: number | null
  image_height: number | null
}

/**
 * One watch's photos (cover first, then the owner's order — sort_order,
 * falling back to display_order, as on the web) and its keep judgements.
 */
export async function fetchWatchDetail(watchId: string): Promise<WatchDetail> {
  const [{ data: photos, error: pErr }, { data: watch, error: wErr }] = await Promise.all([
    supabase
      .from("watch_photos")
      .select("id, storage_path, is_cover, sort_order, display_order, image_width, image_height")
      .eq("watch_id", watchId),
    supabase.from("watches").select("attachment, keep_decision, sentimental").eq("id", watchId).single(),
  ])
  if (pErr) throw new Error(pErr.message)
  if (wErr) throw new Error(wErr.message)

  const ordered = ((photos ?? []) as PhotoRow[]).sort((a, b) => {
    if (a.is_cover !== b.is_cover) return a.is_cover ? -1 : 1
    return (a.sort_order ?? a.display_order) - (b.sort_order ?? b.display_order)
  })
  // The transform is baked into each signed URL, so they are signed one by one.
  const signed = await Promise.all(
    ordered.map(async (p) => {
      const { data } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(p.storage_path, 3600, { transform: CARD_TRANSFORM })
      return data?.signedUrl
        ? { id: p.id, url: data.signedUrl, width: p.image_width, height: p.image_height }
        : null
    })
  )

  const w = watch as { attachment: WatchDetail["attachment"]; keep_decision: KeepDecision | null; sentimental: boolean | null }
  return {
    photos: signed.filter((x): x is NonNullable<typeof x> => x != null),
    attachment: w.attachment,
    keepDecision: w.keep_decision,
    sentimental: !!w.sentimental,
  }
}

/** Attachment / keep decision / sentimental — POST /api/watches/:id/keep. */
export async function setKeepFields(watchId: string, fields: KeepFields): Promise<void> {
  const token = await accessToken()
  if (!token) throw new Error("You're signed out — sign in again.")
  const res = await fetch(`${API_BASE}/api/watches/${watchId}/keep`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(fields),
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(body?.error ?? `Request failed (${res.status}).`)
  }
}

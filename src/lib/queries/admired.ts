import { createClient } from "@/lib/supabase/server"
import { getSignedUrls } from "@/lib/storage"
import type { AdmiredPhotoKind, AdmiredTag } from "@/lib/validations/admired"

export interface AdmiredPhotoView {
  id: string
  kind: AdmiredPhotoKind
  thumb_url: string | null
  full_url: string | null
}

export interface AdmiredWatchView {
  id: string
  event: string | null
  maker: string | null
  model: string | null
  reference: string | null
  price_text: string | null
  notes: string | null
  tags: AdmiredTag[]
  seen_on: string
  placard_read_at: string | null
  created_at: string
  /** Watch shots first, placards after, each in shot order. */
  photos: AdmiredPhotoView[]
}

type Row = Omit<AdmiredWatchView, "photos"> & {
  admired_photos: Array<{
    id: string
    kind: AdmiredPhotoKind
    storage_path: string
    thumb_path: string | null
    display_order: number
  }> | null
}

/** Every admired watch, newest seen first, with signed photo URLs. */
export async function getAdmiredWatches(): Promise<AdmiredWatchView[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("admired_watches")
    .select(
      "id, event, maker, model, reference, price_text, notes, tags, seen_on, placard_read_at, created_at, admired_photos(id, kind, storage_path, thumb_path, display_order)"
    )
    .order("seen_on", { ascending: false })
    .order("created_at", { ascending: false })
  if (error) {
    // Before migration 00056 is applied the table doesn't exist — show an
    // empty board rather than break the Inspiration page.
    console.error("Failed to fetch admired watches:", error.message)
    return []
  }
  const rows = (data ?? []) as unknown as Row[]

  const paths = new Set<string>()
  for (const r of rows) {
    for (const p of r.admired_photos ?? []) {
      paths.add(p.storage_path)
      if (p.thumb_path) paths.add(p.thumb_path)
    }
  }
  const signed = await getSignedUrls([...paths])

  return rows.map(({ admired_photos, ...r }) => ({
    ...r,
    tags: r.tags ?? [],
    photos: [...(admired_photos ?? [])]
      .sort((a, b) => (a.kind === b.kind ? a.display_order - b.display_order : a.kind === "watch" ? -1 : 1))
      .map((p) => ({
        id: p.id,
        kind: p.kind,
        thumb_url: signed.get(p.thumb_path ?? p.storage_path) ?? null,
        full_url: signed.get(p.storage_path) ?? null,
      })),
  }))
}

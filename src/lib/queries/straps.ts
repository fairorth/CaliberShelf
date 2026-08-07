import { createClient } from "@/lib/supabase/server"
import { getSignedUrls } from "@/lib/storage"
import type {
  Strap,
  StrapPhoto,
  StrapWatchRef,
  StrapWithDetails,
  StrapWithPhotos,
} from "@/lib/types/strap"

// Raw shape of the two watch joins (nested brand relation).
interface RawWatchRef {
  id: string
  model: string
  nickname: string | null
  brands: { name: string } | null
}

function toWatchRef(raw: RawWatchRef | null): StrapWatchRef | null {
  if (!raw) return null
  return {
    id: raw.id,
    model: raw.model,
    nickname: raw.nickname,
    brand_name: raw.brands?.name ?? null,
  }
}

// straps has TWO FKs to watches, so each join names its constraint explicitly.
const STRAP_SELECT =
  "*, source_watch:watches!straps_source_watch_id_fkey(id, model, nickname, brands(name)), current_watch:watches!straps_current_watch_id_fkey(id, model, nickname, brands(name))"

type RawStrap = Strap & { source_watch: RawWatchRef | null; current_watch: RawWatchRef | null }

/**
 * All straps for the current user with watch refs and a signed cover thumb.
 * Sorted by width then name for a stable, browsable list.
 */
export async function getStraps(): Promise<StrapWithDetails[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("straps")
    .select(STRAP_SELECT)
    .order("width_mm", { ascending: true })
    .order("name", { ascending: true })

  if (error) {
    console.error("Failed to fetch straps:", error.message)
    return []
  }

  const straps = (data as unknown as RawStrap[]) ?? []
  if (straps.length === 0) return []

  // Batch-sign cover thumbnails (thumb for the grid; original as fallback).
  const { data: covers } = await supabase
    .from("strap_photos")
    .select("strap_id, storage_path, thumb_path")
    .in("strap_id", straps.map((s) => s.id))
    .eq("is_cover", true)

  const coverByStrap = new Map<string, string>()
  for (const c of (covers as Pick<StrapPhoto, "strap_id" | "storage_path" | "thumb_path">[]) ?? []) {
    coverByStrap.set(c.strap_id, c.thumb_path ?? c.storage_path)
  }
  const signed = await getSignedUrls([...coverByStrap.values()])

  return straps.map((s) => {
    const coverPath = coverByStrap.get(s.id)
    return {
      ...s,
      source_watch: toWatchRef(s.source_watch),
      current_watch: toWatchRef(s.current_watch),
      cover_photo_url: coverPath ? signed.get(coverPath) ?? null : null,
    }
  })
}

/**
 * One strap with watch refs and ALL photos (signed originals for the gallery).
 */
export async function getStrapById(id: string): Promise<StrapWithPhotos | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("straps")
    .select(STRAP_SELECT)
    .eq("id", id)
    .single()

  if (error || !data) return null
  const raw = data as unknown as RawStrap

  const { data: photos } = await supabase
    .from("strap_photos")
    .select("*")
    .eq("strap_id", id)
    .order("display_order", { ascending: true })

  const photoRows = (photos as StrapPhoto[]) ?? []
  const signed = await getSignedUrls(photoRows.map((p) => p.storage_path))

  const coverThumb = photoRows.find((p) => p.is_cover)
  const coverPath = coverThumb ? coverThumb.thumb_path ?? coverThumb.storage_path : null
  const coverSigned = coverPath ? await getSignedUrls([coverPath]) : null

  return {
    ...raw,
    source_watch: toWatchRef(raw.source_watch),
    current_watch: toWatchRef(raw.current_watch),
    cover_photo_url: coverPath ? coverSigned?.get(coverPath) ?? null : null,
    photos: photoRows.map((p) => ({ ...p, url: signed.get(p.storage_path) ?? null })),
  }
}

/** Light watch list for the strap form's source/current selects and the
 *  watch-page strap panel. Includes strap_width_mm for fit hints. */
export interface WatchOption {
  id: string
  label: string
  strap_width_mm: number | null
}

export async function getWatchOptions(): Promise<WatchOption[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("watches")
    .select("id, model, nickname, strap_width_mm, is_wishlist, brands(name)")
    .order("model", { ascending: true })

  if (error) {
    console.error("Failed to fetch watch options:", error.message)
    return []
  }

  const rows =
    (data as unknown as Array<{
      id: string
      model: string
      nickname: string | null
      strap_width_mm: number | null
      is_wishlist: boolean
      brands: { name: string } | null
    }>) ?? []

  // Wish-list watches aren't owned — nothing to mount a strap on.
  return rows
    .filter((r) => !r.is_wishlist)
    .map((r) => ({
      id: r.id,
      label: `${r.brands?.name ?? ""} ${r.model}${r.nickname ? ` (${r.nickname})` : ""}`.trim(),
      strap_width_mm: r.strap_width_mm,
    }))
    .sort((a, b) => a.label.localeCompare(b.label))
}

/** The strap currently mounted on a watch (or null). */
export async function getCurrentStrapForWatch(
  watchId: string
): Promise<StrapWithDetails | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("straps")
    .select(STRAP_SELECT)
    .eq("current_watch_id", watchId)
    .maybeSingle()

  if (error || !data) return null
  const raw = data as unknown as RawStrap

  const { data: cover } = await supabase
    .from("strap_photos")
    .select("storage_path, thumb_path")
    .eq("strap_id", raw.id)
    .eq("is_cover", true)
    .maybeSingle()

  let coverUrl: string | null = null
  if (cover) {
    const c = cover as Pick<StrapPhoto, "storage_path" | "thumb_path">
    const path = c.thumb_path ?? c.storage_path
    coverUrl = (await getSignedUrls([path])).get(path) ?? null
  }

  return {
    ...raw,
    source_watch: toWatchRef(raw.source_watch),
    current_watch: toWatchRef(raw.current_watch),
    cover_photo_url: coverUrl,
  }
}

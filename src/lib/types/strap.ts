import type { StrapMaterial } from "@/lib/validations/strap"

// ── Strap / bracelet asset (migration 00037) ───────────────────────

export interface Strap {
  id: string
  user_id: string
  name: string | null
  manufacturer: string | null
  material: StrapMaterial
  color: string | null
  width_mm: number
  quick_release: boolean
  micro_adjust: boolean
  source: string | null
  /** The watch this strap originally shipped with (OEM), if any. */
  source_watch_id: string | null
  /** The watch this strap is currently mounted on (at most one per watch). */
  current_watch_id: string | null
  purchase_date: string | null
  purchase_price_cents: number | null
  purchase_currency: string
  notes: string | null
  created_at: string
  updated_at: string
}

export interface StrapPhoto {
  id: string
  strap_id: string
  user_id: string
  storage_path: string
  thumb_path: string | null
  display_order: number
  is_cover: boolean
  created_at: string
}

/** Light watch reference joined onto straps (source / current watch). */
export interface StrapWatchRef {
  id: string
  model: string
  nickname: string | null
  brand_name: string | null
}

export interface StrapWithDetails extends Strap {
  cover_photo_url: string | null
  source_watch: StrapWatchRef | null
  current_watch: StrapWatchRef | null
}

export interface StrapWithPhotos extends StrapWithDetails {
  photos: Array<StrapPhoto & { url: string | null }>
}

/** Display name for a strap: explicit name, else "Color Material". */
export function strapDisplayName(
  strap: Pick<Strap, "name" | "color" | "material">,
  materialLabel: string
): string {
  if (strap.name) return strap.name
  return [strap.color, materialLabel].filter(Boolean).join(" ")
}

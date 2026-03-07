// Enum types matching Postgres enums from migration 00002
export type MovementType =
  | "automatic"
  | "manual_wind"
  | "quartz"
  | "solar"
  | "spring_drive"
  | "smartwatch"
  | "other"

export type CaseMaterial =
  | "stainless_steel"
  | "titanium"
  | "gold"
  | "rose_gold"
  | "white_gold"
  | "platinum"
  | "ceramic"
  | "carbon"
  | "bronze"
  | "other"

export type CrystalType =
  | "sapphire"
  | "mineral"
  | "acrylic"
  | "hesalite"
  | "other"

export type WatchCondition =
  | "new"
  | "like_new"
  | "excellent"
  | "very_good"
  | "good"
  | "fair"
  | "poor"

// Database row type for watches table
export interface Watch {
  id: string
  user_id: string
  brand: string
  model: string
  reference_number: string | null
  serial_number: string | null
  nickname: string | null
  movement: MovementType | null
  case_material: CaseMaterial | null
  case_diameter_mm: number | null
  crystal: CrystalType | null
  water_resistance_m: number | null
  dial_color: string | null
  complication: string | null
  condition: WatchCondition | null
  purchase_date: string | null
  purchase_price_cents: number | null
  purchase_currency: string
  notes: string | null
  is_public: boolean
  created_at: string
  updated_at: string
}

// Database row type for watch_photos table
export interface WatchPhoto {
  id: string
  watch_id: string
  user_id: string
  storage_path: string
  display_order: number
  caption: string | null
  is_cover: boolean
  created_at: string
}

// Watch with photos joined (common query result)
export interface WatchWithPhotos extends Watch {
  watch_photos: WatchPhoto[]
}

// Watch with cover photo URL (for grid/list views)
export interface WatchWithCover extends Watch {
  cover_photo_url: string | null
}

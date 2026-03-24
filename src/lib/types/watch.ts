// Enum types matching Postgres enums from migrations

export type MovementType =
  | "automatic"
  | "manual_wind"
  | "quartz"
  | "solar"
  | "spring_drive"
  | "smartwatch"
  | "other"

export type DisplayType = "analog" | "digital" | "ana_digi"

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

// ── Brand ──────────────────────────────────────────────────────

export interface Brand {
  id: string
  user_id: string
  name: string
  country_of_origin: string | null
  logo_url: string | null
  created_at: string
  updated_at: string
}

// ── Movement / Caliber ─────────────────────────────────────────

export interface Movement {
  id: string
  user_id: string | null  // NULL = system/seed movement
  caliber_name: string
  manufacturer: string | null
  base_caliber: string | null
  aliases: string | null
  movement_type: MovementType
  display_type: DisplayType
  diameter_mm: number | null
  height_mm: number | null
  jewel_count: number | null
  beat_rate_vph: number | null
  power_reserve_hours: number | null
  accuracy_range: string | null
  hacking: boolean
  hand_windable: boolean
  quickset_date: boolean
  complications: string | null
  country_of_origin: string | null
  production_year_start: number | null
  production_year_end: number | null
  created_at: string
  updated_at: string
}

// ── Category ────────────────────────────────────────────────────

export interface Category {
  id: string
  user_id: string
  name: string
  description: string | null
  color: string | null
  display_order: number
  created_at: string
  updated_at: string
}

export interface CategoryWithWatches extends Category {
  watches: WatchWithCover[]
}

// ── Label ───────────────────────────────────────────────────────

export interface Label {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
}

// ── Watch ──────────────────────────────────────────────────────

export interface Watch {
  id: string
  user_id: string
  brand_id: string
  model: string
  reference_number: string | null
  serial_number: string | null
  nickname: string | null
  movement_id: string | null
  category_id: string
  case_material: CaseMaterial | null
  case_diameter_mm: number | null
  lug_width_mm: number | null
  case_height_mm: number | null
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

// Watch with cover photo URL and joined relations (for grid/list views)
export interface WatchWithCover extends Watch {
  cover_photo_url: string | null
  brand: Brand
  movement: Movement | null
  labels?: Label[]
}

// ── Wear Log ────────────────────────────────────────────────────

export interface WearLog {
  id: string
  user_id: string
  watch_id: string
  worn_date: string // "YYYY-MM-DD"
  notes: string | null
  created_at: string
  updated_at: string
}

export interface WearLogWithWatch extends WearLog {
  watch: WatchWithCover
}

export interface WearStats {
  totalThisMonth: number
  totalThisYear: number
  totalAllTime: number
  mostWorn: Array<{ watch: WatchWithCover; count: number }>
  leastWorn: Array<{ watch: WatchWithCover; count: number }>
  neverWorn: WatchWithCover[]
  currentStreak: number
  longestStreak: number
}

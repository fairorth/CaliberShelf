// Enum types matching Postgres enums/values from migrations

export type CaliberType = "quartz" | "mechanical_manual" | "mechanical_automatic"

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

export type CaseShape =
  | "round"
  | "cushion"
  | "tonneau"
  | "rectangular"
  | "square"
  | "oval"
  | "octagonal"
  | "other"

export type BezelType =
  | "none"
  | "fixed"
  | "dive"
  | "gmt"
  | "tachymeter"
  | "compass"
  | "countdown"
  | "internal"
  | "other"

export type BezelMaterial =
  | "stainless_steel"
  | "titanium"
  | "ceramic"
  | "aluminum"
  | "sapphire"
  | "gold"
  | "bronze"
  | "carbon"
  | "other"

export type BrandType = "major" | "micro" | "indie"

// ── Brand ──────────────────────────────────────────────────────

export interface Brand {
  id: string
  user_id: string
  name: string
  country_of_origin: string | null
  brand_type: BrandType | null
  store_url: string | null
  logo_url: string | null
  created_at: string
  updated_at: string
}

// ── Movement / Caliber ─────────────────────────────────────────

export interface Movement {
  id: string
  user_id: string
  caliber_name: string
  manufacturer: string | null
  caliber_type: CaliberType | null
  beat_rate: string | null
  power_reserve: string | null
  lift_angle: string | null
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
  /** true = reference was agent-supplied and not yet human-verified */
  reference_unverified: boolean
  serial_number: string | null
  nickname: string | null
  movement_id: string | null
  category_id: string
  case_material: CaseMaterial | null
  case_diameter_mm: number | null
  strap_width_mm: number | null
  lug_to_lug_mm: number | null
  case_height_mm: number | null
  weight_g: number | null
  case_shape: CaseShape | null
  bezel_type: BezelType | null
  bezel_material: BezelMaterial | null
  crystal: CrystalType | null
  water_resistance_m: number | null
  dial_color: string | null
  complication: string | null
  purchase_date: string | null
  purchase_price_cents: number | null
  purchase_currency: string
  notes: string | null
  is_public: boolean
  is_coming_soon: boolean
  is_wishlist: boolean
  price_check_enabled: boolean
  dial_focal_x: number
  dial_focal_y: number
  dial_zoom: number
  created_at: string
  updated_at: string
}

// Database row type for watch_photos table
export interface WatchPhoto {
  id: string
  watch_id: string
  user_id: string
  storage_path: string
  thumb_path: string | null
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
  category?: Category
  labels?: Label[]
  /** Total wear-log entries for this watch (populated by getWatches). */
  wear_count?: number
  /** ISO date "YYYY-MM-DD" of the most recent wear, or null if never worn. */
  last_worn_date?: string | null
}

// ── Valuation ───────────────────────────────────────────────────

export interface ValuationDatapoint {
  price_usd: number
  source: string
  type: "sold" | "asking"
  date: string
  note: string
}

// Row produced by the valuation agent (scripts/price-check.mjs)
export interface WatchValuation {
  id: string
  watch_id: string
  user_id: string
  valued_at: string
  value_low_cents: number | null
  value_mid_cents: number
  value_high_cents: number | null
  currency: string
  confidence: "high" | "medium" | "low"
  n_datapoints: number | null
  assumed_variant: string | null
  datapoints: ValuationDatapoint[] | null
  sources: string[] | null
  method_notes: string | null
  caveats: string | null
  agent_model: string | null
  created_at: string
}

// ── Wishlist Deal ───────────────────────────────────────────────

export type DealAvailability =
  | "available"
  | "preorder"
  | "sold_out"
  | "not_found"
  | "no_store"
  | "unknown"

// Row produced by the deal scanner (scripts/deal-check.mjs) — one current
// row per wish-list watch, upserted on each run.
export interface WishlistDeal {
  id: string
  watch_id: string
  user_id: string
  checked_at: string
  source: string
  availability: DealAvailability
  retail_price_cents: number | null
  currency: string
  product_url: string | null
  product_title: string | null
  best_used_price_cents: number | null
  best_used_url: string | null
  best_used_note: string | null
  notes: string | null
  created_at: string
  updated_at: string
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

// ── Timegrapher Run ─────────────────────────────────────────────

export interface TimegrapherRun {
  id: string
  user_id: string
  watch_id: string
  run_date: string // "YYYY-MM-DD"
  rate_sec_per_day: number | null
  amplitude_deg: number | null
  beat_error_ms: number | null
  notes: string | null
  created_at: string
  updated_at: string
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

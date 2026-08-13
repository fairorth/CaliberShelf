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
  /** Wish-list brand: no owned watches yet, but we want one. */
  is_wishlist: boolean
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
  rotating_bezel: boolean
  crystal: CrystalType | null
  water_resistance_m: number | null
  dial_color: string | null
  complication: string | null
  purchase_date: string | null
  purchase_price_cents: number | null
  purchase_currency: string
  /** free-text storage location — which watch case/box holds this watch */
  box: string | null
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

// The five angle classes from docs/photo-lab.md (migration 00041).
export type PhotoAngle = "flat" | "hero" | "profile" | "caseback" | "macro"

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
  /** Angle tag (00041) — set from the lightbox or Photo Lab Review. */
  angle: PhotoAngle | null
  /** Filmstrip order (00041); falls back to display_order when null. */
  sort_order: number | null
  created_at: string
}

// Watch with photos joined (common query result)
export interface WatchWithPhotos extends Watch {
  watch_photos: WatchPhoto[]
}

// Watch with cover photo URL and joined relations (for grid/list views)
export interface WatchWithCover extends Watch {
  /** ~720px on the long edge — heroes, tiles, the table's hover preview. */
  cover_photo_url: string | null
  /** ~192px — the dense thumbnails (table, coverage matrix, capture, wear log).
   *  Downscaling the 720px cover into a 64px cell is a ~9:1 reduction, which is
   *  where browser resampling turns to mush; this gives those cells a source
   *  close to the size they actually paint.
   *
   *  Optional: only getWatches pays for the second signed URL. Queries that
   *  build this shape for other screens omit it, and every consumer falls back
   *  to cover_photo_url, so a missing thumb is soft rather than broken. */
  cover_thumb_url?: string | null
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

// ── Photo Lab: scored frames (migrations 00040/00042) ───────────

export type ScoreAngleClass =
  | "flat_dial_on"
  | "angled_hero"
  | "side_profile"
  | "caseback_clasp"
  | "macro_detail"
  | "other"

export type ReviewState = "unreviewed" | "accepted" | "rejected"

/** One scored capture-folder frame (photo-score.mjs → watch_image_scores). */
export interface WatchImageScore {
  id: string
  watch_id: string
  user_id: string
  watch_photo_id: string | null
  source_kind: "cr3" | "jpeg" | "heif" | "export"
  rel_path: string
  content_hash: string
  stack_seq: number | null
  stack_role: "source" | "composite" | "unstacked" | null
  sharpness_roi: number | null
  brightness: number | null
  glare_fraction: number | null
  phash: string | null
  dup_group: number | null
  dup_best: boolean
  shot_card: string | null
  card_pass: boolean | null
  angle_class: ScoreAngleClass | null
  ai_dial_focus: number | null
  ai_framing: number | null
  ai_reflections: number | null
  ai_background: number | null
  ai_lighting: number | null
  ai_color: number | null
  ai_detail: number | null
  ai_primary_defect: string | null
  ai_unusable: boolean
  ai_model: string | null
  composite_score: number | null
  hero_for_class: boolean
  scored_at: string | null
  review_state: ReviewState
  reviewed_at: string | null
  created_at: string
}

// ── Agent execution audit (migration 00028) ─────────────────────

export type AgentRunStatus = "running" | "success" | "partial" | "failed"
export type AgentRunItemAction =
  | "updated"
  | "skipped"
  | "failed"
  | "flagged"
  | "no-result"

// One agent invocation. Money is integer microdollars (usd * 1_000_000).
export interface AgentRun {
  id: string
  user_id: string | null
  agent: string
  trigger: string
  status: AgentRunStatus
  started_at: string
  finished_at: string | null
  duration_ms: number | null
  model: string | null
  dry_run: boolean
  items_processed: number
  items_updated: number
  items_skipped: number
  items_failed: number
  input_tokens: number
  output_tokens: number
  web_searches: number
  cost_usd_micros: number
  notes: string | null
  created_at: string
}

// One entity an agent touched during a run (the drill-down audit trail).
export interface AgentRunItem {
  id: string
  run_id: string
  user_id: string | null
  entity_type: string | null
  entity_id: string | null
  label: string
  action: AgentRunItemAction
  field: string | null
  detail: string | null
  confidence: string | null
  cost_usd_micros: number | null
  sources: string[] | null
  created_at: string
}

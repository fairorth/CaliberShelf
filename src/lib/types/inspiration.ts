// ── Inspiration Gallery (migration 00039) ──────────────────────────

export interface InspirationImage {
  id: string
  user_id: string
  storage_path: string
  thumb_path: string | null
  note: string | null
  created_at: string
  updated_at: string
}

export interface InspirationImageWithUrls extends InspirationImage {
  /** Signed URL for the grid (thumbnail, falls back to the original). */
  thumb_url: string | null
  /** Signed URL for the full-size lightbox view. */
  full_url: string | null
}

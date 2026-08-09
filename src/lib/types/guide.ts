// ── Master Collection Guides (migration 00038) ─────────────────────

/** Stored entry status — applies only when the entry has no linked watch.
 *  Linked entries derive their status from the watch row live. */
export type GuideEntryStoredStatus = "candidate" | "passed"

/** Display status: stored status, or derived from the linked watch. */
export type GuideEntryDisplayStatus = "owned" | "coming_soon" | "wishlist" | "candidate" | "passed"

export interface CollectionGuide {
  id: string
  user_id: string
  name: string
  thesis: string | null
  source_document: string | null
  version: string | null
  created_at: string
  updated_at: string
}

export interface GuideEntry {
  id: string
  guide_id: string
  user_id: string
  position: number
  chapter: string | null
  title: string
  reference_number: string | null
  caliber: string | null
  year_from: number | null
  dates_text: string | null
  historical_role: string | null
  recommended_variant: string | null
  target_low_cents: number | null
  target_high_cents: number | null
  priority: number | null
  status: GuideEntryStoredStatus
  watch_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

/** Light linked-watch shape for guide display. */
export interface GuideEntryWatchRef {
  id: string
  model: string
  nickname: string | null
  is_wishlist: boolean
  is_coming_soon: boolean
  purchase_price_cents: number | null
}

export interface GuideEntryWithWatch extends GuideEntry {
  watch: GuideEntryWatchRef | null
}

export interface GuideWithStats extends CollectionGuide {
  entry_count: number
  owned_count: number
}

/** The live display status for an entry (§00038 header comment). */
export function guideEntryStatus(entry: GuideEntryWithWatch): GuideEntryDisplayStatus {
  if (entry.watch) {
    if (entry.watch.is_wishlist) return "wishlist"
    if (entry.watch.is_coming_soon) return "coming_soon"
    return "owned"
  }
  return entry.status
}

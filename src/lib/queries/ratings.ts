import { createClient } from "@/lib/supabase/server"
import { pairwiseAgreement, rankWatches } from "@/lib/rating"
import type { RankedWatch, RatingPick } from "@/lib/rating"

/**
 * Rate My Watches — the web's view (00057). Each rater's LATEST completed
 * session per segment (a re-play replaces the earlier one), the consensus —
 * every rater's latest picks per segment re-fitted together with the same
 * model the phone uses (lib/rating.ts) — and agreement with the owner.
 */

export interface RaterView {
  id: string
  name: string
  isOwner: boolean
}

export interface SessionView {
  id: string
  raterId: string
  kind: "segment" | "final"
  /** Category id, or "final". */
  key: string
  segmentName: string
  completedAt: string
  pickCount: number
  ranking: Array<{ watchId: string; rank: number; score: number }>
  /** Share of pairs ordered the same as the owner's latest ranking of this segment. */
  agreementWithOwner: number | null
}

export interface ConsensusView {
  key: string
  segmentName: string
  raterCount: number
  ranking: RankedWatch[]
  /** The watch raters disagree on most (spread of its rank, as a share of the segment). */
  divisive: { watchId: string; spread: number } | null
}

export interface RatingsReport {
  raters: RaterView[]
  sessions: SessionView[]
  consensus: ConsensusView[]
}

type SessionRow = {
  id: string
  rater_id: string
  kind: "segment" | "final"
  category_id: string | null
  segment_name: string
  pick_count: number
  completed_at: string
  result: Array<{ watch_id: string; rank: number; score: number }>
}

export async function getRatingsReport(): Promise<RatingsReport> {
  const supabase = await createClient()
  const [{ data: raterRows, error: rErr }, { data: sessionRows, error: sErr }] = await Promise.all([
    supabase.from("raters").select("id, name, is_owner").order("name"),
    supabase
      .from("rating_sessions")
      .select("id, rater_id, kind, category_id, segment_name, pick_count, completed_at, result")
      .order("completed_at", { ascending: false }),
  ])
  if (rErr || sErr) {
    // Before migration 00057 the tables don't exist — an empty report, not a crash.
    console.error("Failed to load ratings:", (rErr ?? sErr)?.message)
    return { raters: [], sessions: [], consensus: [] }
  }

  const raters = ((raterRows ?? []) as Array<{ id: string; name: string; is_owner: boolean }>).map((r) => ({
    id: r.id,
    name: r.name,
    isOwner: r.is_owner,
  }))
  const ownerId = raters.find((r) => r.isOwner)?.id ?? null

  // Latest per rater per segment (rows arrive newest first).
  const latest = new Map<string, SessionRow>()
  for (const row of (sessionRows ?? []) as SessionRow[]) {
    const key = `${row.rater_id}|${row.kind === "final" ? "final" : row.category_id}`
    if (!latest.has(key)) latest.set(key, row)
  }
  const rows = [...latest.values()]
  const keyOf = (r: SessionRow) => (r.kind === "final" ? "final" : (r.category_id ?? r.segment_name))

  const ownerOrder = new Map<string, string[]>()
  for (const r of rows) {
    if (r.rater_id !== ownerId) continue
    ownerOrder.set(keyOf(r), [...r.result].sort((a, b) => a.rank - b.rank).map((x) => x.watch_id))
  }

  const sessions: SessionView[] = rows.map((r) => {
    const ranking = [...r.result]
      .sort((a, b) => a.rank - b.rank)
      .map((x) => ({ watchId: x.watch_id, rank: x.rank, score: x.score }))
    const ref = ownerOrder.get(keyOf(r))
    const agree =
      r.rater_id !== ownerId && ref ? pairwiseAgreement(ranking.map((x) => x.watchId), ref) : null
    return {
      id: r.id,
      raterId: r.rater_id,
      kind: r.kind,
      key: keyOf(r),
      segmentName: r.segment_name,
      completedAt: r.completed_at,
      pickCount: r.pick_count,
      ranking,
      agreementWithOwner: agree && agree.pairs > 0 ? agree.pct : null,
    }
  })

  // Consensus: re-fit every rater's latest picks per segment together.
  const segmentRows = rows.filter((r) => r.kind === "segment")
  const ids = segmentRows.map((r) => r.id)
  const picksBySession = new Map<string, RatingPick[]>()
  if (ids.length) {
    const { data: pickRows } = await supabase
      .from("rating_picks")
      .select("session_id, left_watch_id, right_watch_id, winner_watch_id")
      .in("session_id", ids)
    for (const p of (pickRows ?? []) as Array<{
      session_id: string
      left_watch_id: string
      right_watch_id: string
      winner_watch_id: string | null
    }>) {
      const list = picksBySession.get(p.session_id) ?? []
      list.push({ a: p.left_watch_id, b: p.right_watch_id, winner: p.winner_watch_id })
      picksBySession.set(p.session_id, list)
    }
  }

  const bySegment = new Map<string, SessionRow[]>()
  for (const r of segmentRows) bySegment.set(keyOf(r), [...(bySegment.get(keyOf(r)) ?? []), r])

  const consensus: ConsensusView[] = [...bySegment.entries()]
    .map(([key, list]) => {
      const watchIds = [...new Set(list.flatMap((r) => r.result.map((x) => x.watch_id)))]
      const picks = list.flatMap((r) => picksBySession.get(r.id) ?? [])
      const ranking = rankWatches(watchIds, picks)
      // Most divisive: the widest spread of where raters put it, as a share
      // of the segment (so a 9-watch and a 40-watch segment compare).
      let divisive: ConsensusView["divisive"] = null
      if (list.length >= 2) {
        for (const id of watchIds) {
          const places = list
            .map((r) => {
              const hit = r.result.find((x) => x.watch_id === id)
              return hit ? (hit.rank - 1) / Math.max(1, r.result.length - 1) : null
            })
            .filter((x): x is number => x !== null)
          if (places.length < 2) continue
          const spread = Math.max(...places) - Math.min(...places)
          if (!divisive || spread > divisive.spread) divisive = { watchId: id, spread }
        }
      }
      return { key, segmentName: list[0].segment_name, raterCount: list.length, ranking, divisive }
    })
    .sort((a, b) => a.segmentName.localeCompare(b.segmentName))

  return { raters, sessions, consensus }
}

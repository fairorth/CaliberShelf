import AsyncStorage from "@react-native-async-storage/async-storage"
import type { RankedWatch } from "@/lib/rating"
import type { SegmentScheme } from "@/lib/rating-segments"
import { configToBands, normalizeTierConfig } from "@/lib/tiers"
import type { TierBand } from "@/lib/tiers"
import { newId } from "./admired-queue"
import { supabase } from "./supabase"

/**
 * Rate My Watches — storage (migration 00057). Straight to Supabase as the
 * owner (RLS): friends play on Marc's phone under his session, they never
 * sign in. A finished segment is saved in one go; if the network drops, it
 * is kept on the phone and retried — ids are generated here, so a repeat
 * save is a no-op, never a duplicate.
 */

export interface Rater {
  id: string
  name: string
  isOwner: boolean
}

export interface PlayedPick {
  left: string
  right: string
  /** null = "Can't choose". */
  winner: string | null
  decidedMs: number
}

export interface FinishedSession {
  id: string
  raterId: string
  kind: "segment" | "final"
  scheme: SegmentScheme
  /** The segment within the scheme (rating-segments.ts), or "final". */
  segmentKey: string
  categoryId: string | null
  segmentName: string
  watchIds: string[]
  picks: PlayedPick[]
  ranking: RankedWatch[]
  startedAt: string
  completedAt: string
}

const PENDING_KEY = "tenten.rateGame.pending.v1"

async function userId(): Promise<string> {
  const { data } = await supabase.auth.getUser()
  if (!data.user) throw new Error("You're signed out — sign in again.")
  return data.user.id
}

export async function fetchRaters(): Promise<Rater[]> {
  const { data, error } = await supabase.from("raters").select("id, name, is_owner").order("name")
  if (error) throw new Error(error.message)
  return ((data ?? []) as Array<{ id: string; name: string; is_owner: boolean }>).map((r) => ({
    id: r.id,
    name: r.name,
    isOwner: r.is_owner,
  }))
}

/** The rater by this name (case-insensitive), creating them if new. */
export async function getOrCreateRater(name: string, isOwner: boolean, existing: Rater[]): Promise<Rater> {
  const trimmed = name.trim()
  const match = existing.find((r) => r.name.toLowerCase() === trimmed.toLowerCase())
  if (match) return match
  const rater: Rater = { id: newId(), name: trimmed, isOwner }
  const { error } = await supabase
    .from("raters")
    .insert({ id: rater.id, user_id: await userId(), name: rater.name, is_owner: isOwner })
  if (error && error.code === "23505") {
    // Created on another device or a moment ago — use that row.
    const fresh = await fetchRaters()
    const again = fresh.find((r) => r.name.toLowerCase() === trimmed.toLowerCase())
    if (again) return again
  }
  if (error) throw new Error(error.message)
  return rater
}

/** Key for one segment of one scheme — how rankings are compared like for like. */
export const rankingKey = (scheme: SegmentScheme, segmentKey: string) => `${scheme}|${segmentKey}`

/**
 * The owner's own latest ranking per segment of every scheme — the yardstick
 * for "you agree with Marc". Keyed by rankingKey(scheme, segmentKey).
 */
export async function fetchOwnerRankings(): Promise<Map<string, string[]>> {
  const { data, error } = await supabase
    .from("rating_sessions")
    .select("segment_scheme, segment_key, result, completed_at, raters!inner(is_owner)")
    .eq("raters.is_owner", true)
    .order("completed_at", { ascending: false })
  if (error) return new Map()
  const out = new Map<string, string[]>()
  for (const row of (data ?? []) as unknown as Array<{
    segment_scheme: SegmentScheme
    segment_key: string
    result: Array<{ watch_id: string; rank: number }>
  }>) {
    const key = rankingKey(row.segment_scheme, row.segment_key)
    if (out.has(key)) continue // newest first: keep the latest
    out.set(
      key,
      [...row.result].sort((a, b) => a.rank - b.rank).map((r) => r.watch_id)
    )
  }
  return out
}

async function insertSession(s: FinishedSession): Promise<void> {
  const uid = await userId()
  const { error } = await supabase.from("rating_sessions").insert({
    id: s.id,
    user_id: uid,
    rater_id: s.raterId,
    kind: s.kind,
    // A session queued before v1.11.16 has no scheme/key: it was a Type game.
    segment_scheme: s.scheme ?? "type",
    segment_key: s.segmentKey ?? (s.kind === "final" ? "final" : (s.categoryId ?? `name:${s.segmentName}`)),
    category_id: s.categoryId,
    segment_name: s.segmentName.slice(0, 80),
    watch_count: s.watchIds.length,
    pick_count: s.picks.length,
    result: s.ranking.map((r) => ({ watch_id: r.watchId, rank: r.rank, score: r.score })),
    started_at: s.startedAt,
    completed_at: s.completedAt,
  })
  if (error && error.code !== "23505") throw new Error(error.message)

  const rows = s.picks.map((p, seq) => ({
    // Deterministic per session + position, so a retry can't double a pick.
    id: pickId(s.id, seq),
    user_id: uid,
    session_id: s.id,
    left_watch_id: p.left,
    right_watch_id: p.right,
    winner_watch_id: p.winner,
    decided_ms: Math.max(0, Math.round(p.decidedMs)),
    seq,
  }))
  if (rows.length) {
    const { error: pErr } = await supabase.from("rating_picks").upsert(rows, { onConflict: "id", ignoreDuplicates: true })
    if (pErr) throw new Error(pErr.message)
  }
}

/** A UUID derived from the session id and the pick's position. */
function pickId(sessionId: string, seq: number): string {
  const tail = (parseInt(sessionId.slice(-12), 16) + seq + 1).toString(16).padStart(12, "0").slice(-12)
  return `${sessionId.slice(0, 24)}${tail}`
}

/** Save a finished segment; if it can't reach the server, keep it for later. */
export async function saveSession(s: FinishedSession): Promise<"saved" | "queued"> {
  try {
    await insertSession(s)
    return "saved"
  } catch {
    const pending = await readPending()
    if (!pending.some((p) => p.id === s.id)) pending.push(s)
    await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(pending))
    return "queued"
  }
}

async function readPending(): Promise<FinishedSession[]> {
  try {
    const raw = await AsyncStorage.getItem(PENDING_KEY)
    return raw ? (JSON.parse(raw) as FinishedSession[]) : []
  } catch {
    return []
  }
}

/** Retry anything left unsaved (called when a game starts and when one ends). */
export async function flushPendingSessions(): Promise<number> {
  const pending = await readPending()
  if (pending.length === 0) return 0
  const left: FinishedSession[] = []
  for (const s of pending) {
    try {
      await insertSession(s)
    } catch {
      left.push(s)
    }
  }
  await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(left))
  return left.length
}

// ── Unfinished games ───────────────────────────────────────────────
// A game lives on the phone between sittings, one per rater: the segments
// finished in it (so the checkmarks and Best in Show survive) and the picks
// of any segment left half-played. Written after every pick, so quitting a
// segment, handing the phone back or the app being killed loses nothing.
// Cleared when Best in Show is played, when the owner discards it, or after
// GAME_TTL_DAYS of no play. Phone-only on purpose: friends play on this
// phone, and a finished segment is already on the server.

export interface DoneSegment {
  scheme: SegmentScheme
  key: string
  name: string
  ranking: RankedWatch[]
}

export interface SegmentInProgress {
  name: string
  picks: PlayedPick[]
  /** pairKey()s the rater skipped — not offered again while others remain. */
  skipped: string[]
  startedAt: string
}

export interface SavedGame {
  raterId: string
  scheme: SegmentScheme
  done: DoneSegment[]
  /** Keyed by rankingKey(scheme, segmentKey). */
  inProgress: Record<string, SegmentInProgress>
  updatedAt: string
}

const GAMES_KEY = "tenten.rateGame.games.v1"
const GAME_TTL_DAYS = 30

async function readGames(): Promise<Record<string, SavedGame>> {
  try {
    const raw = await AsyncStorage.getItem(GAMES_KEY)
    const all = raw ? (JSON.parse(raw) as Record<string, SavedGame>) : {}
    const cutoff = Date.now() - GAME_TTL_DAYS * 86_400_000
    for (const [id, g] of Object.entries(all)) if (Date.parse(g.updatedAt) < cutoff) delete all[id]
    return all
  } catch {
    return {}
  }
}

// Writes go one at a time: a pick lands every second or two, and two
// overlapping read-modify-writes would drop one of them.
let gamesWrite: Promise<void> = Promise.resolve()
function writeGames(change: (all: Record<string, SavedGame>) => void): Promise<void> {
  gamesWrite = gamesWrite.then(async () => {
    try {
      const all = await readGames()
      change(all)
      await AsyncStorage.setItem(GAMES_KEY, JSON.stringify(all))
    } catch {
      // Best effort — the game itself never waits on, or fails with, this.
    }
  })
  return gamesWrite
}

/** Every unfinished game on this phone, newest first. */
export async function listSavedGames(): Promise<SavedGame[]> {
  await gamesWrite
  return Object.values(await readGames()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export async function loadSavedGame(raterId: string): Promise<SavedGame | null> {
  await gamesWrite
  return (await readGames())[raterId] ?? null
}

/** Save the game — or forget it when there is nothing left to resume. */
export function storeSavedGame(game: SavedGame): Promise<void> {
  const empty = game.done.length === 0 && Object.keys(game.inProgress).length === 0
  return writeGames((all) => {
    if (empty) delete all[game.raterId]
    else all[game.raterId] = game
  })
}

export function discardSavedGame(raterId: string): Promise<void> {
  return writeGames((all) => {
    delete all[raterId]
  })
}

/** The owner's price tiers (Config → Tiers) as bands — for the Tier segments. */
export async function fetchTierBands(): Promise<TierBand[]> {
  const { data: auth } = await supabase.auth.getUser()
  const uid = auth.user?.id
  if (!uid) return configToBands(normalizeTierConfig(null))
  const { data } = await supabase.from("profiles").select("tier_config").eq("id", uid).maybeSingle()
  return configToBands(normalizeTierConfig((data as { tier_config?: unknown } | null)?.tier_config ?? null))
}

export { newId }

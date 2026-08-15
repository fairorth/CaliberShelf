import { createClient } from "@/lib/supabase/server"
import { getWatches } from "@/lib/queries/watches"
import { angleFromScoreClass, PHOTO_ANGLES } from "@/lib/photo-lab"
import type {
  PhotoAngle,
  WatchImageScore,
  WatchWithCover,
} from "@/lib/types/watch"

// ── Coverage (04-screen-specs §3) ───────────────────────────────────

export interface CoverageCell {
  /** Uploaded watch_photos tagged with this angle. */
  photoCount: number
  /** Scored capture-folder frames classified as this angle. */
  scoreCount: number
  /** Best composite score among those frames (null = nothing scored). */
  bestScore: number | null
}

export interface CoverageRow {
  watch: WatchWithCover
  cells: Record<PhotoAngle, CoverageCell>
  /** All uploaded photos, any angle (0 = never shot at all). */
  totalPhotos: number
  /** Angles with at least one frame or photo. */
  coveredCount: number
}

export interface PhotoLabCoverage {
  rows: CoverageRow[]
  heroCovered: number
  noPhotoAtAll: number
  awaitingReview: number
  /** Empty cells across all rows — the reshoot workload. */
  reshootCount: number
}

/** A score row still waiting in Review: not a stack source, never reviewed.
 *  The ONE definition — the coverage matrix and the home Light Table's
 *  "Awaiting review" stat must never disagree. */
export function isAwaitingReview(
  s: Pick<WatchImageScore, "stack_role" | "review_state">
): boolean {
  return s.stack_role !== "source" && (s.review_state ?? "unreviewed") === "unreviewed"
}

/** Just the Awaiting-review count (home Light Table stats block, Phase 6). */
export async function getAwaitingReviewCount(): Promise<number> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("watch_image_scores")
    .select("stack_role, review_state")
  return (
    (data ?? []) as Pick<WatchImageScore, "stack_role" | "review_state">[]
  ).filter(isAwaitingReview).length
}

export async function getPhotoLabCoverage(): Promise<PhotoLabCoverage> {
  const supabase = await createClient()

  // Owned watches only — wish-list entries have nothing to shoot (D1), and a
  // sold watch is no longer in hand to reshoot (§3.6).
  const watches = (await getWatches()).filter(
    (w) => !w.is_wishlist && w.sale_status !== "sold"
  )

  const [photosRes, scoresRes] = await Promise.all([
    supabase.from("watch_photos").select("watch_id, angle"),
    supabase
      .from("watch_image_scores")
      .select("watch_id, angle_class, composite_score, review_state, stack_role"),
  ])

  const photos = (photosRes.data ?? []) as {
    watch_id: string
    angle: PhotoAngle | null
  }[]
  const scores = (scoresRes.data ?? []) as Pick<
    WatchImageScore,
    "watch_id" | "angle_class" | "composite_score" | "review_state" | "stack_role"
  >[]

  const emptyCells = (): Record<PhotoAngle, CoverageCell> =>
    Object.fromEntries(
      PHOTO_ANGLES.map((a) => [a, { photoCount: 0, scoreCount: 0, bestScore: null }])
    ) as Record<PhotoAngle, CoverageCell>

  const byWatch = new Map<string, { cells: Record<PhotoAngle, CoverageCell>; total: number }>()
  for (const w of watches) byWatch.set(w.id, { cells: emptyCells(), total: 0 })

  for (const p of photos) {
    const entry = byWatch.get(p.watch_id)
    if (!entry) continue
    entry.total++
    if (p.angle) entry.cells[p.angle].photoCount++
  }

  let awaitingReview = 0
  for (const s of scores) {
    if (s.stack_role === "source") continue
    if (isAwaitingReview(s)) awaitingReview++
    const entry = byWatch.get(s.watch_id)
    if (!entry) continue
    const angle = angleFromScoreClass(s.angle_class)
    if (!angle) continue
    const cell = entry.cells[angle]
    cell.scoreCount++
    if (s.composite_score != null) {
      cell.bestScore = Math.max(cell.bestScore ?? -Infinity, s.composite_score)
    }
  }

  const rows: CoverageRow[] = watches.map((watch) => {
    const entry = byWatch.get(watch.id)!
    const coveredCount = PHOTO_ANGLES.filter(
      (a) => entry.cells[a].photoCount + entry.cells[a].scoreCount > 0
    ).length
    return { watch, cells: entry.cells, totalPhotos: entry.total, coveredCount }
  })

  // Worst coverage first — the matrix is a to-do list, not a trophy case.
  rows.sort((a, b) => a.coveredCount - b.coveredCount)

  const heroCovered = rows.filter(
    (r) => r.cells.hero.photoCount + r.cells.hero.scoreCount > 0
  ).length
  const noPhotoAtAll = rows.filter((r) => r.totalPhotos === 0).length
  const reshootCount = rows.reduce((sum, r) => sum + (PHOTO_ANGLES.length - r.coveredCount), 0)

  return { rows, heroCovered, noPhotoAtAll, awaitingReview, reshootCount }
}

// ── Review (04-screen-specs §4) ─────────────────────────────────────

export interface ReviewFrame extends WatchImageScore {
  watch_brand: string
  watch_model: string
  watch_nickname: string | null
}

export interface PhotoLabReview {
  /** Every non-source frame (all states — the client filters the queue and
   *  uses the full set for duplicate-cluster context). */
  frames: ReviewFrame[]
  lastRun: { startedAt: string; costMicros: number } | null
}

export async function getPhotoLabReview(): Promise<PhotoLabReview> {
  const supabase = await createClient()

  const [scoresRes, runRes] = await Promise.all([
    supabase
      .from("watch_image_scores")
      .select("*, watches(model, nickname, brands(name))")
      .neq("stack_role", "source")
      .order("scored_at", { ascending: false })
      .order("rel_path", { ascending: true }),
    supabase
      .from("agent_runs")
      .select("started_at, cost_usd_micros")
      .eq("agent", "photo-score")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  type Joined = WatchImageScore & {
    watches: { model: string; nickname: string | null; brands: { name: string } | null } | null
  }
  const rows = (scoresRes.data ?? []) as unknown as Joined[]

  const frames: ReviewFrame[] = rows.map((r) => {
    const { watches: w, ...score } = r
    return {
      ...(score as WatchImageScore),
      watch_brand: w?.brands?.name ?? "",
      watch_model: w?.model ?? "",
      watch_nickname: w?.nickname ?? null,
    }
  })

  const run = runRes.data as { started_at: string; cost_usd_micros: number } | null

  return {
    frames,
    lastRun: run ? { startedAt: run.started_at, costMicros: run.cost_usd_micros } : null,
  }
}

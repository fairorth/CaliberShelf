"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ImageOff, Plus } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import { ANGLE_HEADINGS, gradeForScore, PHOTO_ANGLES } from "@/lib/photo-lab"
import type { CoverageRow } from "@/lib/queries/photo-lab"
import type { PhotoAngle } from "@/lib/types/watch"
import { cn } from "@/lib/utils"

type SortMode = "worst" | "best" | "brand"

interface CoverageMatrixProps {
  rows: CoverageRow[]
  /** Seed the "never shot only" toggle (the Reshoot list button). */
  initialNeverShot?: boolean
}

/** The watch × angle coverage matrix (D1, 04-screen-specs §3): every cell is
 *  a to-do state — scored / frames-unscored / empty. Cell click starts a
 *  Session pre-set to that angle; row click opens the watch page. */
export function CoverageMatrix({ rows, initialNeverShot = false }: CoverageMatrixProps) {
  const router = useRouter()
  const [sortMode, setSortMode] = useState<SortMode>("worst")
  const [boxFilter, setBoxFilter] = useState<string>("")
  const [neverShotOnly, setNeverShotOnly] = useState(initialNeverShot)

  const boxes = useMemo(
    () =>
      [...new Set(rows.map((r) => r.watch.box).filter((b): b is string => Boolean(b)))].sort(
        (a, b) => a.localeCompare(b, undefined, { numeric: true })
      ),
    [rows]
  )

  const visible = useMemo(() => {
    let out = rows
    if (boxFilter) out = out.filter((r) => r.watch.box === boxFilter)
    if (neverShotOnly) out = out.filter((r) => r.totalPhotos === 0)
    const sorted = [...out]
    if (sortMode === "worst") sorted.sort((a, b) => a.coveredCount - b.coveredCount)
    else if (sortMode === "best") sorted.sort((a, b) => b.coveredCount - a.coveredCount)
    else
      sorted.sort((a, b) =>
        `${a.watch.brand.name} ${a.watch.model}`.localeCompare(
          `${b.watch.brand.name} ${b.watch.model}`
        )
      )
    return sorted
  }, [rows, sortMode, boxFilter, neverShotOnly])

  const SORT_LABELS: Record<SortMode, string> = {
    worst: "Sort: worst coverage first",
    best: "Sort: best coverage first",
    brand: "Sort: brand",
  }

  return (
    <div className="space-y-3">
      {/* Filter row + legend */}
      <div className="flex flex-wrap items-center gap-2.5">
        <Select value={sortMode} onValueChange={(v) => v && setSortMode(v as SortMode)}>
          <SelectTrigger className="h-[34px] w-[230px]">
            <span className="text-xs">{SORT_LABELS[sortMode]}</span>
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(SORT_LABELS) as SortMode[]).map((m) => (
              <SelectItem key={m} value={m}>
                {SORT_LABELS[m]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={boxFilter} onValueChange={(v) => setBoxFilter(v ?? "")}>
          <SelectTrigger className="h-[34px] w-[140px]">
            <span className="text-xs">{boxFilter ? `Box: ${boxFilter}` : "Box: all"}</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Box: all</SelectItem>
            {boxes.map((b) => (
              <SelectItem key={b} value={b}>
                {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <button
          type="button"
          onClick={() => setNeverShotOnly((v) => !v)}
          aria-pressed={neverShotOnly}
          className={cn(
            "h-[34px] rounded-lg border px-3 text-xs font-medium transition-colors",
            neverShotOnly
              ? "border-brass/50 bg-brass/14 text-brass"
              : "border-border text-muted-foreground hover:text-foreground"
          )}
        >
          Never shot only
        </button>

        {/* Three states: brass (scored), neutral (unscored), outline (empty).
            The scored swatch was --chart-2, a vivid system blue — chart colours
            are for data series, not UI state (E1). */}
        <div className="ml-auto flex items-center gap-4 font-mono text-2xs uppercase tracking-[0.08em] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-[11px] w-[11px] rounded-sm bg-brass" aria-hidden="true" />
            Scored
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-[11px] w-[11px] rounded-sm bg-secondary" aria-hidden="true" />
            Unscored
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="h-[11px] w-[11px] rounded-sm border border-dashed border-border"
              aria-hidden="true"
            />
            Empty
          </span>
        </div>
      </div>

      {/* The matrix */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <div className="min-w-[860px]">
          {/* Header row */}
          <div className="grid h-11 grid-cols-[300px_repeat(5,1fr)_120px] items-center border-b border-border px-2 font-mono text-2xs uppercase tracking-[0.1em] text-muted-foreground">
            <div className="px-2">Watch</div>
            {PHOTO_ANGLES.map((a) => (
              <div key={a} className="text-center">
                {ANGLE_HEADINGS[a]}
              </div>
            ))}
            <div className="pr-2 text-right">Coverage</div>
          </div>

          {visible.length === 0 && (
            <p className="px-4 py-8 text-sm text-muted-foreground">
              No watches match this filter.
            </p>
          )}

          {visible.map((row) => (
            <div
              key={row.watch.id}
              role="button"
              tabIndex={0}
              onClick={() => router.push(`/watch/${row.watch.id}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter") router.push(`/watch/${row.watch.id}`)
              }}
              className="grid h-16 cursor-pointer grid-cols-[300px_repeat(5,1fr)_120px] items-center border-b border-border/60 px-2 transition-colors duration-150 last:border-b-0 hover:bg-foreground/2 focus-visible:bg-foreground/2 focus-visible:outline-none"
            >
              {/* Watch cell */}
              <div className="flex min-w-0 items-center gap-3 px-2">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {row.watch.cover_photo_url ? (
                    <Image
                      src={row.watch.cover_photo_url}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="40px"
                      unoptimized
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center text-muted-foreground">
                      <ImageOff className="h-4 w-4 opacity-70" aria-hidden="true" />
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{row.watch.brand.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {row.watch.nickname || row.watch.model}
                  </p>
                </div>
              </div>

              {/* Angle cells */}
              {PHOTO_ANGLES.map((angle) => (
                <CoverageCellView
                  key={angle}
                  angle={angle}
                  cell={row.cells[angle]}
                  watchId={row.watch.id}
                  reshoot={row.totalPhotos === 0}
                />
              ))}

              {/* Coverage column */}
              <div
                className={cn(
                  "pr-2 text-right font-mono text-xs tabular-nums",
                  row.coveredCount === 0
                    ? "text-destructive"
                    : row.coveredCount <= 2
                      ? "text-chart-4"
                      : "text-foreground"
                )}
              >
                {row.coveredCount}/5
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function CoverageCellView({
  angle,
  cell,
  watchId,
  reshoot,
}: {
  angle: PhotoAngle
  cell: CoverageRow["cells"][PhotoAngle]
  watchId: string
  reshoot: boolean
}) {
  const router = useRouter()
  const total = cell.photoCount + cell.scoreCount
  const sessionHref = `/photo-lab/session?watch=${watchId}&angle=${angle}`

  function open(e: React.MouseEvent | React.KeyboardEvent) {
    e.stopPropagation()
    router.push(sessionHref)
  }

  return (
    <div className="flex justify-center">
      {cell.bestScore != null ? (
        <button
          type="button"
          onClick={open}
          title={`Shoot ${angle} — best ${gradeForScore(cell.bestScore)}`}
          className="flex h-[26px] items-center rounded-full bg-brass/18 px-2.5 font-mono text-2xs text-brass transition-colors hover:bg-brass/28"
        >
          {gradeForScore(cell.bestScore)} · {total}
        </button>
      ) : total > 0 ? (
        <button
          type="button"
          onClick={open}
          title={`Shoot ${angle} — ${total} frame${total === 1 ? "" : "s"}, unscored`}
          className="flex h-[26px] items-center rounded-full bg-secondary px-2.5 font-mono text-2xs text-muted-foreground transition-colors hover:text-foreground"
        >
          {total}
        </button>
      ) : (
        <button
          type="button"
          onClick={open}
          aria-label={`Start a session for this ${angle} shot`}
          title={`Shoot ${angle}`}
          className={cn(
            "flex h-[26px] w-[26px] items-center justify-center rounded-full border border-dashed text-muted-foreground transition-colors hover:border-brass/60 hover:text-brass",
            // Brass now means "scored" in the legend, so an empty cell cannot
            // also rest on brass — it would read as done. Never-shot rows keep
            // a stronger border instead, and brass returns on hover, where it
            // means the action (start a session for this angle).
            reshoot ? "border-foreground/30" : "border-border"
          )}
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}

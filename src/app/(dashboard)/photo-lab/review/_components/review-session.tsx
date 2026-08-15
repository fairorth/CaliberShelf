"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { Check, Info, Keyboard, Star, X, ZoomIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  promoteScoredFrame,
  setFrameReviewState,
} from "@/lib/actions/photo-lab-actions"
import {
  ANGLE_LABELS,
  angleFromScoreClass,
  gradeForScore,
  PHOTO_ANGLES,
} from "@/lib/photo-lab"
import type { PhotoLabReview, ReviewFrame } from "@/lib/queries/photo-lab"
import type { PhotoAngle } from "@/lib/types/watch"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const clamp01 = (v: number) => Math.max(0, Math.min(1, v))

/** Matches the Agent Execution Review's cost formatting (integer µ$). */
function formatCostMicros(micros: number): string {
  if (!micros || micros <= 0) return "free"
  const dollars = micros / 1_000_000
  return dollars < 0.01 ? `$${dollars.toFixed(4)}` : `$${dollars.toFixed(2)}`
}

function metricBarColor(v: number): string {
  if (v >= 0.7) return "bg-chart-2"
  if (v >= 0.5) return "bg-brass"
  return "bg-destructive"
}

function MetricRow({ label, value }: { label: string; value: number | null }) {
  if (value == null) return null
  const v = clamp01(value)
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono tabular-nums text-foreground">{v.toFixed(2)}</span>
      </div>
      <div className="h-[3px] overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full", metricBarColor(v))} style={{ width: `${v * 100}%` }} />
      </div>
    </div>
  )
}

/** Photo Lab · Review (D1, 04-screen-specs §4): judge scored frames at size,
 *  keyboard-first. Accept promotes into watch_photos in one action. */
export function ReviewSession({ frames, lastRun }: PhotoLabReview) {
  // Locally processed ids keep the queue moving before revalidation lands.
  const [processed, setProcessed] = useState<Set<string>>(new Set())
  const [index, setIndex] = useState(0)
  const [zoomed, setZoomed] = useState(false)
  const [angleChoice, setAngleChoice] = useState<PhotoAngle | null>(null)
  const [isPending, startTransition] = useTransition()

  const queue = useMemo(
    () =>
      frames.filter(
        (f) => (f.review_state ?? "unreviewed") === "unreviewed" && !processed.has(f.id)
      ),
    [frames, processed]
  )
  const current: ReviewFrame | undefined = queue[Math.min(index, Math.max(0, queue.length - 1))]

  // Seed the angle pills from the scorer's classification whenever the
  // frame changes (the adjust-state-during-render idiom — no effect needed).
  const currentId = current?.id ?? null
  const [seededFor, setSeededFor] = useState<string | null>(null)
  if (currentId !== seededFor) {
    setSeededFor(currentId)
    setAngleChoice(current ? angleFromScoreClass(current.angle_class) : null)
    setZoomed(false)
  }

  const scoredCount = frames.filter((f) => f.composite_score != null).length

  function advance() {
    setIndex((i) => Math.max(0, Math.min(i, queue.length - 2)))
  }

  function accept(setCover: boolean) {
    if (!current || isPending) return
    const id = current.id
    startTransition(async () => {
      const result = await promoteScoredFrame(id, { angle: angleChoice, setCover })
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success(setCover ? "Accepted — set as cover" : "Accepted")
      setProcessed((prev) => new Set(prev).add(id))
      advance()
    })
  }

  function reject() {
    if (!current || isPending) return
    const id = current.id
    startTransition(async () => {
      const result = await setFrameReviewState(id, "rejected" as const)
      if (result.error) {
        toast.error(result.error)
        return
      }
      setProcessed((prev) => new Set(prev).add(id))
      advance()
    })
  }

  // Keyboard-first: the whole flow works without a mouse (D1).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
        return
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1))
      else if (e.key === "ArrowRight") setIndex((i) => Math.min(queue.length - 1, i + 1))
      else if (e.key === "a" || e.key === "A") accept(false)
      else if (e.key === "r" || e.key === "R") reject()
      else if (e.key === "c" || e.key === "C") accept(true)
      else if (e.key === "z" || e.key === "Z") setZoomed((z) => !z)
      else if (e.key >= "1" && e.key <= "5") {
        const next = PHOTO_ANGLES[Number(e.key) - 1]
        setAngleChoice((prev) => (prev === next ? null : next))
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  })

  if (queue.length === 0 || !current) {
    return (
      <div className="rounded-xl border border-dashed border-border py-16 text-center">
        <p className="text-sm text-muted-foreground">
          {frames.length === 0
            ? "No scored frames yet — run the photo-score pass after a session."
            : "Every frame is reviewed. Run the scorer after the next session."}
        </p>
      </div>
    )
  }

  const grade =
    current.composite_score != null ? gradeForScore(current.composite_score) : null
  const gradeTone =
    current.composite_score == null
      ? "text-muted-foreground"
      : current.composite_score >= 0.65
        ? "text-chart-2"
        : current.composite_score >= 0.45
          ? "text-chart-4"
          : "text-destructive"

  const cluster =
    current.dup_group != null
      ? frames.filter(
          (f) => f.watch_id === current.watch_id && f.dup_group === current.dup_group
        )
      : []
  const keptInCluster = cluster.filter((f) => f.dup_best).length

  const stackPill =
    current.stack_role === "composite"
      ? "STACKED COMPOSITE"
      : `SINGLE${current.source_kind === "cr3" ? " · CR3" : ""}`

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <span className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground">
          Run: photo-score
          {lastRun &&
            ` · ${new Date(lastRun.startedAt).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}`}
        </span>
        <span className="font-mono text-xs uppercase text-muted-foreground">
          Frame <span className="text-foreground">{index + 1}</span> / {queue.length}
        </span>
        <div className="h-[3px] w-full max-w-[280px] overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-brass"
            style={{ width: `${((index + 1) / queue.length) * 100}%` }}
          />
        </div>
        <span className="ml-auto flex items-center gap-4 font-mono text-2xs uppercase tracking-[0.08em] text-muted-foreground">
          <span>
            {frames.length} frames · {scoredCount} scored
            {lastRun && (
              <>
                {" · "}
                <span className="text-chart-2">{formatCostMicros(lastRun.costMicros)}</span>
              </>
            )}
          </span>
          <span className="flex items-center gap-1.5">
            <Keyboard className="h-3.5 w-3.5" aria-hidden="true" /> Shortcuts
          </span>
        </span>
      </div>

      {/* Body */}
      <div className="grid items-start gap-[18px] lg:grid-cols-[1fr_360px]">
        <div className="space-y-2.5">
          <div className="relative overflow-hidden rounded-xl border border-border bg-surface-photo">
            <div className={cn("aspect-[3/2]", zoomed && "overflow-auto")}>
              {/* eslint-disable-next-line @next/next/no-img-element -- local API route serves the frame; next/image can't optimize it */}
              <img
                src={`/api/photo-lab/frame/${current.id}${zoomed ? "?full=1" : ""}`}
                alt={`Frame ${current.rel_path}`}
                className={cn(
                  "h-full w-full",
                  zoomed ? "max-w-none object-none" : "object-contain"
                )}
              />
            </div>
            <div className="pointer-events-none absolute left-3 top-3 flex gap-1.5">
              <span className="rounded-full bg-primary/16 px-2.5 py-0.5 font-mono text-2xs uppercase tracking-[0.08em] text-primary">
                {stackPill}
              </span>
              {current.angle_class && (
                <span className="rounded-full bg-black/50 px-2.5 py-0.5 font-mono text-2xs uppercase tracking-[0.08em] text-white/90">
                  {angleFromScoreClass(current.angle_class) ?? current.angle_class}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setZoomed((z) => !z)}
              aria-pressed={zoomed}
              className="absolute bottom-3 right-3 flex h-[30px] items-center gap-1.5 rounded-lg bg-black/50 px-2.5 font-mono text-2xs uppercase text-white transition-colors hover:bg-black/65"
            >
              <ZoomIn className="h-3.5 w-3.5" aria-hidden="true" />
              {zoomed ? "Fit" : "Z · 100%"}
            </button>
          </div>

          {/* Duplicate cluster */}
          {cluster.length > 1 && (
            <div className="flex items-center gap-2.5">
              <div className="flex gap-1.5">
                {cluster.map((f) => (
                  <div
                    key={f.id}
                    className={cn(
                      "relative h-[56px] w-[76px] overflow-hidden rounded-lg bg-surface-photo",
                      f.id === current.id ? "border-2 border-brass" : "border border-border",
                      !f.dup_best && "opacity-45"
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/photo-lab/frame/${f.id}`}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
              <span className="font-mono text-2xs uppercase tracking-[0.08em] text-muted-foreground">
                Dup cluster · {keptInCluster} of {cluster.length} kept
              </span>
            </div>
          )}

          <p className="font-mono text-2xs text-muted-foreground">
            <span className="text-foreground">
              {current.watch_brand} {current.watch_nickname || current.watch_model}
            </span>{" "}
            · {current.rel_path}
          </p>
        </div>

        {/* Side panel */}
        <div className="space-y-3.5">
          <div className="space-y-3 rounded-xl border border-border bg-card p-4">
            <p className="font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground">
              Score
            </p>
            <p className={cn("font-display text-lg font-semibold", gradeTone)}>
              {grade ?? "Unscored"}
              {current.composite_score != null && (
                <span className="ml-2 font-mono text-xs text-muted-foreground">
                  {current.composite_score.toFixed(2)}
                </span>
              )}
            </p>
            <MetricRow label="Dial-ROI sharpness" value={current.sharpness_roi} />
            <MetricRow
              label="Highlight control"
              value={current.glare_fraction != null ? 1 - current.glare_fraction : null}
            />
            <MetricRow
              label="Framing"
              value={current.ai_framing != null ? current.ai_framing / 5 : null}
            />
            {(current.shot_card || current.ai_primary_defect) && (
              <p className="text-xs leading-relaxed text-muted-foreground">
                {current.shot_card && (
                  <>
                    <span className="text-foreground">{current.shot_card}</span>
                    {current.card_pass != null &&
                      (current.card_pass ? " · pass" : " · fail")}
                    {current.ai_primary_defect ? " — " : ""}
                  </>
                )}
                {current.ai_primary_defect}
              </p>
            )}
            {current.ai_model && (
              <p className="font-mono text-2xs uppercase tracking-[0.08em] text-muted-foreground">
                {current.ai_model} shot-card
              </p>
            )}
          </div>

          <div className="space-y-2.5 rounded-xl border border-border bg-card p-4">
            <p className="font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground">
              Angle · 1–5
            </p>
            <div className="flex flex-wrap gap-1.5">
              {PHOTO_ANGLES.map((a, i) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAngleChoice((prev) => (prev === a ? null : a))}
                  aria-pressed={angleChoice === a}
                  className={cn(
                    "rounded-full px-2.5 py-1 font-mono text-2xs uppercase tracking-[0.08em] transition-colors",
                    angleChoice === a
                      ? "bg-brass text-brass-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  {i + 1} · {ANGLE_LABELS[a]}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2.5">
              <Button
                onClick={() => accept(false)}
                disabled={isPending}
                className="h-10 gap-1.5 bg-brass text-sm font-semibold text-brass-foreground hover:bg-brass/90"
              >
                <Check className="h-4 w-4" aria-hidden="true" />
                Accept <span className="opacity-75">A</span>
              </Button>
              <Button
                variant="outline"
                onClick={reject}
                disabled={isPending}
                className="h-10 gap-1.5"
              >
                <X className="h-4 w-4" aria-hidden="true" />
                Reject <span className="opacity-75">R</span>
              </Button>
            </div>
            <Button
              variant="outline"
              onClick={() => accept(true)}
              disabled={isPending}
              className="h-10 w-full gap-1.5"
            >
              <Star className="h-4 w-4" aria-hidden="true" />
              Accept &amp; set as cover <span className="opacity-75">C</span>
            </Button>
            <p className="flex justify-between font-mono text-2xs uppercase tracking-[0.08em] text-muted-foreground">
              <span>← → navigate</span>
              <span>Z zoom</span>
              <span>Esc exit</span>
            </p>
          </div>

          {/* A real constraint from docs/photo-lab.md — keep it visible. */}
          <div className="flex gap-2.5 rounded-xl border border-primary/20 bg-primary/7 p-3.5">
            <Info className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              Singles are sharp only at the focal plane — never graded against composites.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

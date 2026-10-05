"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Heart } from "lucide-react"
import { toast } from "sonner"
import { Switch } from "@/components/ui/switch"
import { StatusPill } from "@/components/ui/status-pill"
import { setKeepFields } from "@/lib/actions/keep-actions"
import { ATTACHMENT_LEVELS, attachmentLabels } from "@/lib/validations/watch"
import {
  KEEP_DECISIONS,
  REPLACEABILITY_LEVELS,
  keepDecisionLabels,
  replaceabilityHints,
  replaceabilityLabels,
  type KeepDecision,
  type Replaceability,
} from "@/lib/validations/keep"
import type { Attachment } from "@/lib/types/watch"
import { cn } from "@/lib/utils"

export interface RateWatch {
  id: string
  brand: string
  model: string
  nickname: string | null
  photoUrl: string | null
  category: string | null
  dial: string
  sizeMm: number | null
  comingSoon: boolean
  lastWorn: string | null
  attachment: Attachment | null
  replaceability: Replaceability | null
  sentimental: boolean
  decision: KeepDecision | null
}

type Ratings = Pick<RateWatch, "attachment" | "replaceability" | "sentimental" | "decision">

/** Keys, laid out the way the controls read left to right. */
const ATTACHMENT_KEYS = ["1", "2", "3", "4", "5"]
const REPLACE_KEYS = ["q", "w", "e", "r"]
const DECISION_KEYS: Record<string, KeepDecision> = { k: "keep", m: "maybe", s: "sell" }

function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
  keys,
  labels,
  hints,
}: {
  label: string
  options: readonly T[]
  value: T | null
  onChange: (v: T | null) => void
  keys: string[]
  labels: Record<T, string>
  hints?: Record<T, string>
}) {
  return (
    <div className="space-y-1.5">
      <p className="font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <div role="radiogroup" aria-label={label} className="flex h-10 overflow-hidden rounded-lg border border-border">
        {options.map((opt, i) => (
          <button
            key={opt}
            type="button"
            role="radio"
            aria-checked={value === opt}
            title={hints?.[opt]}
            onClick={() => onChange(value === opt ? null : opt)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 px-2 text-sm transition-colors [&:not(:first-child)]:border-l [&:not(:first-child)]:border-border",
              value === opt ? "bg-brass/15 text-brass" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <kbd className="hidden font-mono text-2xs text-muted-foreground sm:inline">{keys[i]?.toUpperCase()}</kbd>
            {labels[opt]}
          </button>
        ))}
      </div>
    </div>
  )
}

export function RatingSession({ watches: initialWatches }: { watches: RateWatch[] }) {
  // Frozen at mount. Every save revalidates this route, and the server
  // shuffles afresh on each render — taking new props would re-deal the deck
  // under you after every keypress.
  const [watches] = useState(initialWatches)
  const [ratings, setRatings] = useState<Record<string, Ratings>>(() =>
    Object.fromEntries(
      watches.map((w) => [
        w.id,
        { attachment: w.attachment, replaceability: w.replaceability, sentimental: w.sentimental, decision: w.decision },
      ])
    )
  )
  // Unrated-only by default while there is anything unrated. The queue is a
  // snapshot taken when the mode is chosen, so a watch does not vanish the
  // moment you rate it (and ← still finds it).
  const [onlyUnrated, setOnlyUnrated] = useState(() => initialWatches.some((w) => !w.attachment))
  const [queue, setQueue] = useState<RateWatch[]>(() => {
    const unrated = initialWatches.filter((w) => !w.attachment)
    return unrated.length > 0 ? unrated : initialWatches
  })
  const [autoAdvance, setAutoAdvance] = useState(true)

  function chooseMode(unratedOnly: boolean) {
    setOnlyUnrated(unratedOnly)
    setQueue(unratedOnly ? watches.filter((w) => !ratings[w.id].attachment) : watches)
    setIndex(0)
  }
  const [index, setIndex] = useState(0)
  const [, startTransition] = useTransition()

  const current = queue[Math.min(index, queue.length - 1)] ?? null
  const r = current ? ratings[current.id] : null

  const dist = useMemo(() => {
    const d: Record<Attachment | "unrated", number> = { max: 0, high: 0, medium: 0, low: 0, none: 0, unrated: 0 }
    for (const w of watches) d[ratings[w.id].attachment ?? "unrated"]++
    return d
  }, [watches, ratings])

  const total = watches.length
  const target = Math.round(total / 2)
  const rated = total - dist.unrated

  function save(id: string, patch: Partial<Ratings>) {
    const prev = ratings[id]
    setRatings((cur) => ({ ...cur, [id]: { ...cur[id], ...patch } }))
    const payload: Parameters<typeof setKeepFields>[1] = {}
    if ("attachment" in patch) payload.attachment = patch.attachment
    if ("replaceability" in patch) payload.replaceability = patch.replaceability
    if ("sentimental" in patch) payload.sentimental = patch.sentimental
    if ("decision" in patch) payload.keep_decision = patch.decision
    startTransition(async () => {
      const res = await setKeepFields(id, payload)
      if (res.error) {
        toast.error(res.error)
        setRatings((cur) => ({ ...cur, [id]: prev }))
      }
    })
  }

  function go(delta: number) {
    setIndex((i) => Math.max(0, Math.min(queue.length - 1, i + delta)))
  }

  function setAttachment(v: Attachment | null) {
    if (!current) return
    save(current.id, { attachment: v })
    // Attachment is the last thing you set on a watch, so it moves you on.
    if (v && autoAdvance) window.setTimeout(() => go(1), 220)
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!current || e.metaKey || e.ctrlKey || e.altKey) return
      const tag = (document.activeElement as HTMLElement | null)?.tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return
      const key = e.key.toLowerCase()
      const ai = ATTACHMENT_KEYS.indexOf(key)
      const ri = REPLACE_KEYS.indexOf(key)
      if (ai >= 0) {
        e.preventDefault()
        const v = ATTACHMENT_LEVELS[ai]
        setAttachment(r?.attachment === v ? null : v)
      } else if (ri >= 0) {
        e.preventDefault()
        const v = REPLACEABILITY_LEVELS[ri]
        save(current.id, { replaceability: r?.replaceability === v ? null : v })
      } else if (key in DECISION_KEYS) {
        e.preventDefault()
        const v = DECISION_KEYS[key]
        save(current.id, { decision: r?.decision === v ? null : v })
      } else if (key === "h") {
        e.preventDefault()
        save(current.id, { sentimental: !r?.sentimental })
      } else if (e.key === "ArrowRight" || e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        go(1)
      } else if (e.key === "ArrowLeft") {
        e.preventDefault()
        go(-1)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  })

  const maxHigh = dist.max + dist.high
  const BAR: { key: Attachment | "unrated"; label: string }[] = [
    ...ATTACHMENT_LEVELS.map((a) => ({ key: a, label: attachmentLabels[a] })),
    { key: "unrated", label: "Unrated" },
  ]

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-4">
        {!current ? (
          <div className="rounded-xl border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">
            {onlyUnrated ? (
              <>
                Everything is rated.{" "}
                <button type="button" className="underline-offset-2 hover:underline" onClick={() => chooseMode(false)}>
                  Go round again
                </button>{" "}
                or{" "}
                <Link href="/market/edit/faceoff" className="underline-offset-2 hover:underline">
                  settle the close calls
                </Link>
                .
              </>
            ) : (
              "No watches to rate."
            )}
          </div>
        ) : (
          <>
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-border bg-muted">
              {current.photoUrl ? (
                <Image
                  key={current.id}
                  src={current.photoUrl}
                  alt={`${current.brand} ${current.model}`}
                  fill
                  priority
                  className="object-contain"
                  sizes="(min-width: 1024px) 720px, 100vw"
                />
              ) : (
                <span className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                  No photo
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <Link
                  href={`/watch/${current.id}`}
                  className="font-display text-md font-semibold text-foreground hover:underline"
                >
                  {current.brand} {current.model}
                </Link>
                <p className="mt-1 text-sm text-muted-foreground">
                  {[
                    current.nickname ? `“${current.nickname}”` : null,
                    current.category,
                    current.dial !== "Unspecified" ? `${current.dial} dial` : null,
                    current.sizeMm ? `${current.sizeMm}mm` : null,
                    current.lastWorn ? `last worn ${current.lastWorn}` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {current.comingSoon && <StatusPill tone="outline">Coming soon</StatusPill>}
                <span className="font-mono text-xs tabular-nums text-muted-foreground">
                  {Math.min(index, queue.length - 1) + 1} / {queue.length}
                </span>
                <button
                  type="button"
                  onClick={() => go(-1)}
                  disabled={index === 0}
                  aria-label="Previous watch"
                  className="rounded-lg border border-border p-1.5 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  disabled={index >= queue.length - 1}
                  aria-label="Next watch"
                  className="rounded-lg border border-border p-1.5 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto]">
                <Segmented
                  label="Replaceability"
                  options={REPLACEABILITY_LEVELS}
                  value={r?.replaceability ?? null}
                  onChange={(v) => save(current.id, { replaceability: v })}
                  keys={REPLACE_KEYS}
                  labels={replaceabilityLabels}
                  hints={replaceabilityHints}
                />
                <div className="space-y-1.5">
                  <p className="font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground">Sentimental</p>
                  <button
                    type="button"
                    aria-pressed={r?.sentimental ?? false}
                    onClick={() => save(current.id, { sentimental: !r?.sentimental })}
                    className={cn(
                      "flex h-10 items-center gap-2 rounded-lg border px-3 text-sm transition-colors",
                      r?.sentimental
                        ? "border-brass/45 bg-brass/15 text-brass"
                        : "border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <kbd className="hidden font-mono text-2xs text-muted-foreground sm:inline">H</kbd>
                    <Heart className="h-4 w-4" aria-hidden="true" />
                    {r?.sentimental ? "Never sell" : "No"}
                  </button>
                </div>
              </div>
              <Segmented
                label="Pile"
                options={KEEP_DECISIONS}
                value={r?.decision ?? null}
                onChange={(v) => save(current.id, { decision: v })}
                keys={["k", "m", "s"]}
                labels={keepDecisionLabels}
              />
              <Segmented
                label="Attachment — sets and moves on"
                options={ATTACHMENT_LEVELS}
                value={r?.attachment ?? null}
                onChange={setAttachment}
                keys={ATTACHMENT_KEYS}
                labels={attachmentLabels as Record<Attachment, string>}
              />
            </div>
          </>
        )}
      </div>

      <aside className="space-y-5">
        <div className="space-y-3 rounded-xl border border-border bg-card p-4">
          <div className="flex items-baseline justify-between">
            <p className="font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground">Your spread</p>
            <span className="font-mono text-xs tabular-nums text-muted-foreground">
              {rated} / {total} rated
            </span>
          </div>
          <ul className="space-y-1.5">
            {BAR.map((b) => (
              <li key={b.key} className="flex items-center gap-2 text-xs">
                <span className="w-16 text-muted-foreground">{b.label}</span>
                <span className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <span
                    className={cn("absolute inset-y-0 left-0 rounded-full", b.key === "unrated" ? "bg-muted-foreground/40" : "bg-brass/60")}
                    style={{ width: `${total ? (dist[b.key] / total) * 100 : 0}%` }}
                  />
                </span>
                <span className="w-8 text-right font-mono tabular-nums text-foreground">{dist[b.key]}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">
            Halving lands near <span className="font-mono tabular-nums text-foreground">{target}</span>. Roughly{" "}
            {Math.round(total * 0.15)} Max and {Math.round(total * 0.3)} High leaves the scale room to decide.
            {maxHigh > target && (
              <span className="mt-1.5 block text-warning">
                Max + High is {maxHigh} — more than the target, so attachment alone cannot make the cut.
                Be stingier, or let the head-to-heads separate them.
              </span>
            )}
          </p>
        </div>

        <div className="space-y-3 rounded-xl border border-border bg-card p-4 text-sm">
          <label className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Unrated only</span>
            <Switch
              checked={onlyUnrated}
              onCheckedChange={(v) => chooseMode(v)}
            />
          </label>
          <label className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Advance after attachment</span>
            <Switch checked={autoAdvance} onCheckedChange={setAutoAdvance} />
          </label>
          <p className="text-xs text-muted-foreground">
            Keys: 1–5 attachment · Q W E R replaceability · H sentimental · K M S pile · ← → move.
          </p>
        </div>
      </aside>
    </div>
  )
}

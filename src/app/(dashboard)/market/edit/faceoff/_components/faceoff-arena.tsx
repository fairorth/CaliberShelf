"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import Image from "next/image"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Heart, RotateCcw, SkipForward } from "lucide-react"
import { toast } from "sonner"
import { StatusPill } from "@/components/ui/status-pill"
import { recordFaceoff, deleteFaceoff } from "@/lib/actions/keep-actions"
import { DEFAULT_LAMBDA, pickFaceoffs, runEdit, type EditRow, type Faceoff } from "@/lib/the-edit"
import type { EditData } from "@/lib/queries/keep"
import { attachmentLabels } from "@/lib/validations/watch"
import { cn } from "@/lib/utils"

function readNumber(raw: string | null, fallback: number): number {
  const n = raw == null ? NaN : Number(raw)
  return Number.isFinite(n) ? n : fallback
}

function pairKey(a: string, b: string) {
  return a < b ? `${a}|${b}` : `${b}|${a}`
}

export function FaceoffArena({ data: initial }: { data: EditData }) {
  const params = useSearchParams()
  // Frozen at mount: each pick revalidates the route, and adopting the new
  // props would double-count the pick already appended locally.
  const [data] = useState(initial)
  const [faceoffs, setFaceoffs] = useState<Faceoff[]>(initial.faceoffs)
  const [skipped, setSkipped] = useState<Set<string>>(new Set())
  const [answered, setAnswered] = useState(0)
  const [pending, startTransition] = useTransition()

  const target = readNumber(params.get("target"), Math.round(data.watches.length / 2))
  const lambda = readNumber(params.get("lambda"), DEFAULT_LAMBDA)

  // Re-ranked after every pick: one answer can move the line, which changes
  // which question is worth asking next.
  const result = useMemo(
    () => runEdit(data.watches, faceoffs, data.coverage, { target, lambda }),
    [data, faceoffs, target, lambda]
  )
  const pairs = useMemo(
    () =>
      pickFaceoffs(result, faceoffs, 40).filter(
        (p) => !skipped.has(pairKey(p.a.watch.id, p.b.watch.id))
      ),
    [result, faceoffs, skipped]
  )
  const pair = pairs[0] ?? null

  function pick(winner: EditRow, loser: EditRow) {
    if (pending) return
    const optimistic: Faceoff = {
      id: `pending-${Date.now()}`,
      winnerId: winner.watch.id,
      loserId: loser.watch.id,
      createdAt: new Date().toISOString(),
    }
    setFaceoffs((cur) => [...cur, optimistic])
    setAnswered((n) => n + 1)
    startTransition(async () => {
      const res = await recordFaceoff(winner.watch.id, loser.watch.id)
      if (res.error || !res.id) {
        toast.error(res.error ?? "Could not save that pick.")
        setFaceoffs((cur) => cur.filter((f) => f.id !== optimistic.id))
        setAnswered((n) => n - 1)
        return
      }
      setFaceoffs((cur) => cur.map((f) => (f.id === optimistic.id ? { ...f, id: res.id! } : f)))
    })
  }

  function skip() {
    if (!pair) return
    setSkipped((cur) => new Set(cur).add(pairKey(pair.a.watch.id, pair.b.watch.id)))
  }

  function undo() {
    const last = faceoffs[faceoffs.length - 1]
    if (!last || last.id.startsWith("pending-") || answered === 0) return
    setFaceoffs((cur) => cur.slice(0, -1))
    setAnswered((n) => n - 1)
    startTransition(async () => {
      const res = await deleteFaceoff(last.id)
      if (res.error) {
        toast.error(res.error)
        setFaceoffs((cur) => [...cur, last])
        setAnswered((n) => n + 1)
      }
    })
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const tag = (document.activeElement as HTMLElement | null)?.tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return
      if (e.key.toLowerCase() === "z") {
        e.preventDefault()
        undo()
        return
      }
      if (!pair) return
      if (e.key === "ArrowLeft" || e.key === "1") {
        e.preventDefault()
        pick(pair.a, pair.b)
      } else if (e.key === "ArrowRight" || e.key === "2") {
        e.preventDefault()
        pick(pair.b, pair.a)
      } else if (e.key === "ArrowDown" || e.key.toLowerCase() === "s") {
        e.preventDefault()
        skip()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  })

  const qs = `target=${result.target}&lambda=${lambda}`

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <span>
          <span className="font-mono tabular-nums text-foreground">{answered}</span> answered this session ·{" "}
          <span className="font-mono tabular-nums text-foreground">{faceoffs.length}</span> in all ·{" "}
          {pairs.length} worth asking right now
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={undo}
            disabled={answered === 0 || pending}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs transition-colors hover:text-foreground disabled:opacity-40"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Undo
          </button>
          <button
            type="button"
            onClick={skip}
            disabled={!pair}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs transition-colors hover:text-foreground disabled:opacity-40"
          >
            <SkipForward className="h-3.5 w-3.5" aria-hidden="true" /> Can’t choose
          </button>
        </div>
      </div>

      {!pair ? (
        <div className="rounded-xl border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">
          No close calls left at this cut line.{" "}
          <Link href={`/market/edit?${qs}`} className="underline-offset-2 hover:underline">
            Back to The Edit
          </Link>
          .
        </div>
      ) : (
        <>
          {pair.traits.length > 0 && (
            <p className="text-center font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground">
              {pair.traits.join(" · ")}
            </p>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            <Contender row={pair.a} hotkey="←" onPick={() => pick(pair.a, pair.b)} disabled={pending} />
            <Contender row={pair.b} hotkey="→" onPick={() => pick(pair.b, pair.a)} disabled={pending} />
          </div>
          <p className="text-center text-xs text-muted-foreground">
            ← / → (or 1 / 2) keeps that one · S or ↓ skips · Z undoes
          </p>
        </>
      )}
    </div>
  )
}

function Contender({
  row,
  hotkey,
  onPick,
  disabled,
}: {
  row: EditRow
  hotkey: string
  onPick: () => void
  disabled: boolean
}) {
  const w = row.watch
  return (
    <button
      type="button"
      onClick={onPick}
      disabled={disabled}
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl border border-border bg-card text-left transition-colors",
        "hover:border-brass focus-visible:border-brass focus-visible:outline-none"
      )}
    >
      <span className="relative aspect-square w-full bg-muted">
        {(w.photoUrl ?? w.thumbUrl) && (
          <Image
            src={(w.photoUrl ?? w.thumbUrl)!}
            alt={w.name}
            fill
            className="object-contain transition-transform duration-200 ease-out group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            sizes="(min-width: 768px) 50vw, 100vw"
          />
        )}
        <kbd className="absolute left-3 top-3 rounded-md bg-card/90 px-2 py-0.5 font-mono text-xs text-muted-foreground">
          {hotkey}
        </kbd>
      </span>
      <span className="flex flex-col gap-1.5 p-4">
        <span className="flex items-center gap-2">
          <span className="truncate font-display text-md font-semibold text-foreground">{w.name}</span>
          {w.sentimental && <Heart className="h-4 w-4 shrink-0 text-brass" aria-label="Sentimental" />}
        </span>
        <span className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {w.nickname && <span>“{w.nickname}”</span>}
          <StatusPill tone="neutral">
            {w.attachment ? `${attachmentLabels[w.attachment]} attachment` : "Unrated"}
          </StatusPill>
          {w.isComingSoon && <StatusPill tone="outline">Coming</StatusPill>}
        </span>
        <span className="text-xs text-muted-foreground">
          Keep this one
        </span>
      </span>
    </button>
  )
}

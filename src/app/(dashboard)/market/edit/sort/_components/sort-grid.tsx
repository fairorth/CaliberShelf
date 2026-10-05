"use client"

import { useEffect, useMemo, useRef, useState, useTransition } from "react"
import Image from "next/image"
import Link from "next/link"
import { Heart } from "lucide-react"
import { toast } from "sonner"
import { SearchInput } from "@/components/search-input"
import { setKeepFields } from "@/lib/actions/keep-actions"
import { KEEP_DECISIONS, keepDecisionLabels, type KeepDecision } from "@/lib/validations/keep"
import { cn } from "@/lib/utils"

export interface PileWatch {
  id: string
  brand: string
  model: string
  nickname: string | null
  thumbUrl: string | null
  box: string | null
  boxLabel: string | null
  decision: KeepDecision | null
  sentimental: boolean
  comingSoon: boolean
}

type PileFilter = "all" | "undecided" | KeepDecision

const KEY_TO_DECISION: Record<string, KeepDecision | null> = {
  k: "keep",
  m: "maybe",
  s: "sell",
  "0": null,
}

export function SortGrid({ watches }: { watches: PileWatch[] }) {
  // Local copy so a click lands instantly; the server write follows and is
  // rolled back if it fails.
  const [decisions, setDecisions] = useState<Record<string, KeepDecision | null>>(() =>
    Object.fromEntries(watches.map((w) => [w.id, w.decision]))
  )
  const [box, setBox] = useState<string>("all")
  const [pileFilter, setPileFilter] = useState<PileFilter>("all")
  const [query, setQuery] = useState("")
  const [focusId, setFocusId] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const tileRefs = useRef(new Map<string, HTMLDivElement>())
  const gridRef = useRef<HTMLDivElement>(null)

  const boxes = useMemo(() => {
    const m = new Map<string, string>()
    for (const w of watches) if (w.box) m.set(w.box, w.boxLabel ?? w.box)
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }))
  }, [watches])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return watches.filter((w) => {
      if (box === "none" ? w.box : box !== "all" && w.box !== box) return false
      const d = decisions[w.id]
      if (pileFilter === "undecided" ? d != null : pileFilter !== "all" && d !== pileFilter) return false
      if (q && !`${w.brand} ${w.model} ${w.nickname ?? ""}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [watches, box, pileFilter, query, decisions])

  const counts = useMemo(() => {
    const c = { keep: 0, maybe: 0, sell: 0, undecided: 0 }
    for (const w of watches) {
      const d = decisions[w.id]
      if (d) c[d]++
      else c.undecided++
    }
    return c
  }, [watches, decisions])

  function decide(id: string, next: KeepDecision | null) {
    const prev = decisions[id] ?? null
    if (prev === next) return
    setDecisions((cur) => ({ ...cur, [id]: next }))
    startTransition(async () => {
      const res = await setKeepFields(id, { keep_decision: next })
      if (res.error) {
        toast.error(res.error)
        setDecisions((cur) => ({ ...cur, [id]: prev }))
      }
    })
  }

  function columnCount(): number {
    const grid = gridRef.current
    if (!grid) return 1
    return getComputedStyle(grid).gridTemplateColumns.split(" ").length
  }

  function moveFocus(id: string) {
    setFocusId(id)
    tileRefs.current.get(id)?.scrollIntoView({ block: "nearest", behavior: "smooth" })
  }

  // Keyboard: K / M / S / 0 on the focused tile; arrows move through the grid.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const tag = (document.activeElement as HTMLElement | null)?.tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return
      if (!focusId) return
      const idx = visible.findIndex((w) => w.id === focusId)
      if (idx < 0) return
      const key = e.key.toLowerCase()
      if (key in KEY_TO_DECISION) {
        e.preventDefault()
        decide(focusId, KEY_TO_DECISION[key])
        // Move on, so a run of the same pile is a run of keypresses.
        const next = visible[idx + 1]
        if (next) moveFocus(next.id)
        return
      }
      const cols = columnCount()
      const delta =
        e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : e.key === "ArrowDown" ? cols : e.key === "ArrowUp" ? -cols : 0
      if (delta !== 0) {
        e.preventDefault()
        const target = visible[Math.max(0, Math.min(visible.length - 1, idx + delta))]
        if (target) moveFocus(target.id)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  })

  const FILTERS: { value: PileFilter; label: string; n: number }[] = [
    { value: "all", label: "All", n: watches.length },
    { value: "undecided", label: "Undecided", n: counts.undecided },
    { value: "keep", label: "Keep", n: counts.keep },
    { value: "maybe", label: "Maybe", n: counts.maybe },
    { value: "sell", label: "Sell", n: counts.sell },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Pile">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              role="radio"
              aria-checked={pileFilter === f.value}
              onClick={() => setPileFilter(f.value)}
              className={cn(
                "rounded-full px-3 py-1 text-xs transition-colors ring-1",
                pileFilter === f.value
                  ? "bg-brass/15 text-brass ring-brass/35"
                  : "text-muted-foreground ring-border hover:text-foreground"
              )}
            >
              {f.label} <span className="font-mono tabular-nums">{f.n}</span>
            </button>
          ))}
        </div>
        <select
          value={box}
          onChange={(e) => setBox(e.target.value)}
          aria-label="Box"
          className="h-8 rounded-lg border border-border bg-transparent px-2 text-sm"
        >
          <option value="all">All boxes</option>
          {boxes.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
          <option value="none">Not in a box</option>
        </select>
        <SearchInput value={query} onChange={setQuery} placeholder="Filter…" className="w-56" />
      </div>

      {visible.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
          Nothing in this pile.
        </p>
      ) : (
        <div
          ref={gridRef}
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7"
        >
          {visible.map((w) => {
            const d = decisions[w.id] ?? null
            const focused = focusId === w.id
            return (
              <div
                key={w.id}
                ref={(el) => {
                  if (el) tileRefs.current.set(w.id, el)
                  else tileRefs.current.delete(w.id)
                }}
                className={cn(
                  "flex flex-col overflow-hidden rounded-xl border bg-card transition-colors",
                  focused ? "border-brass ring-2 ring-brass/40" : "border-border",
                  d === "sell" && "opacity-60"
                )}
              >
                <button
                  type="button"
                  onClick={() => setFocusId(w.id)}
                  className="relative aspect-square w-full bg-muted"
                  aria-label={`Select ${w.brand} ${w.model}`}
                >
                  {w.thumbUrl && (
                    <Image src={w.thumbUrl} alt="" fill className="object-cover" sizes="180px" />
                  )}
                  {w.sentimental && (
                    <span
                      className="absolute right-1.5 top-1.5 rounded-full bg-card/90 p-1 text-brass"
                      title="Sentimental — never suggested for sale"
                    >
                      <Heart className="h-3 w-3" aria-hidden="true" />
                    </span>
                  )}
                </button>
                <div className="flex flex-1 flex-col gap-2 p-2">
                  <Link
                    href={`/watch/${w.id}`}
                    className="min-w-0 text-xs leading-tight text-muted-foreground hover:text-foreground"
                  >
                    <span className="block truncate font-medium text-foreground">{w.brand}</span>
                    <span className="block truncate">{w.model}</span>
                  </Link>
                  <div
                    role="radiogroup"
                    aria-label="Pile"
                    className="mt-auto flex h-7 overflow-hidden rounded-lg border border-border"
                  >
                    {KEEP_DECISIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        role="radio"
                        aria-checked={d === opt}
                        onClick={() => {
                          setFocusId(w.id)
                          decide(w.id, d === opt ? null : opt)
                        }}
                        className={cn(
                          "flex-1 text-2xs font-medium transition-colors [&:not(:first-child)]:border-l [&:not(:first-child)]:border-border",
                          d === opt ? "bg-brass/15 text-brass" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {keepDecisionLabels[opt]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

"use client"

import { useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Heart, Swords } from "lucide-react"
import { StatusPill } from "@/components/ui/status-pill"
import { KeepDecisionControl } from "@/components/keep-decision-control"
import {
  DEFAULT_LAMBDA,
  pickFaceoffs,
  runEdit,
  type CompositionRow,
  type EditRow,
} from "@/lib/the-edit"
import type { EditData } from "@/lib/queries/keep"
import { VALUATION_SOURCE_LABEL } from "@/lib/valuation"
import { cn, formatCurrency } from "@/lib/utils"

const EYEBROW = "font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground"

function readNumber(raw: string | null, fallback: number): number {
  const n = raw == null ? NaN : Number(raw)
  return Number.isFinite(n) ? n : fallback
}

/** Sliders write the URL without a server round trip — Next keeps
 *  useSearchParams in step with history.replaceState. Linkable, survives a
 *  trip to a watch and back, costs nothing. */
function writeParams(next: Record<string, string>) {
  const params = new URLSearchParams(window.location.search)
  for (const [k, v] of Object.entries(next)) params.set(k, v)
  window.history.replaceState(null, "", `?${params.toString()}`)
}

export function EditBoard({ data }: { data: EditData }) {
  const params = useSearchParams()
  const poolSize = data.watches.length
  const target = readNumber(params.get("target"), Math.round(poolSize / 2))
  const lambda = readNumber(params.get("lambda"), DEFAULT_LAMBDA)

  const result = useMemo(
    () => runEdit(data.watches, data.faceoffs, data.coverage, { target, lambda }),
    [data, target, lambda]
  )
  const questions = useMemo(() => pickFaceoffs(result, data.faceoffs, 50).length, [result, data.faceoffs])

  const available = poolSize - result.decidedCount
  const kept = result.rows.filter((r) => r.verdict === "locked" || r.verdict === "keep")
  const sells = result.rows.filter((r) => r.verdict === "sell")
  const decided = result.rows.filter((r) => r.verdict === "decided")
  const bubble = result.rows.filter((r) => r.bubble)
  const sellValue = sells.reduce((s, r) => s + (r.watch.valueCents ?? 0), 0)
  const qs = `target=${result.target}&lambda=${lambda}`

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_280px]">
        <div className="space-y-2 rounded-xl border border-border bg-card p-4">
          <div className="flex items-baseline justify-between">
            <label htmlFor="edit-target" className={EYEBROW}>
              Keep
            </label>
            <span className="font-mono text-sm tabular-nums text-foreground">
              {result.target} <span className="text-muted-foreground">of {poolSize}</span>
            </span>
          </div>
          <input
            id="edit-target"
            type="range"
            min={result.lockedCount}
            max={available}
            value={result.target}
            onChange={(e) => writeParams({ target: e.target.value })}
            className="w-full accent-brass"
          />
          <p className="text-xs text-muted-foreground">
            {result.lockedCount} locked (sentimental or marked Keep) · {result.decidedCount} already going
          </p>
        </div>

        <div className="space-y-2 rounded-xl border border-border bg-card p-4">
          <div className="flex items-baseline justify-between">
            <label htmlFor="edit-lambda" className={EYEBROW}>
              Duplication penalty
            </label>
            <span className="font-mono text-sm tabular-nums text-foreground">{lambda.toFixed(2)}</span>
          </div>
          <input
            id="edit-lambda"
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={lambda}
            onChange={(e) => writeParams({ lambda: e.target.value })}
            className="w-full accent-brass"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Attachment only</span>
            <span>Variety first</span>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-3 rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">{result.wear.status}</p>
          <Link
            href={`/market/edit/faceoff?${qs}`}
            className="inline-flex items-center gap-2 self-start rounded-lg bg-brass px-3 py-1.5 text-sm font-medium text-brass-foreground transition-colors hover:bg-brass/90"
          >
            <Swords className="h-4 w-4" aria-hidden="true" />
            {questions > 0 ? `${questions} close calls to settle` : "Head-to-heads"}
          </Link>
        </div>
      </div>

      {/* The answer, in one line */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Keeping" value={String(kept.length)} context={`${result.lockedCount} locked · ${kept.length - result.lockedCount} picked`} />
        <Stat label="Suggested to sell" value={String(sells.length)} context="the algorithm's call — yours to confirm" />
        <Stat
          label="Their value"
          value={sellValue > 0 ? formatCurrency(sellValue, "USD", true) : "—"}
          context={
            <>
              before fees ·{" "}
              <Link href="/market/to-sell" className="underline-offset-2 hover:underline">
                To Sell
              </Link>{" "}
              counts the decided ones
            </>
          }
        />
        <Stat label="Already going" value={String(decided.length)} context="marked Sell, or listed" />
      </div>

      {/* Before → after */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Composition title="Function" rows={result.composition.function} />
        <Composition title="Category" rows={result.composition.category} />
        <Composition title="Dial" rows={result.composition.dial} />
      </div>

      {/* The cut line */}
      {bubble.length > 0 && (
        <Section
          title="On the bubble"
          meta={`${bubble.length} either side of the line`}
          note="The closest calls. A head-to-head between look-alikes here moves the line more than anything else."
        >
          {bubble.map((r, i) => (
            <div key={r.watch.id}>
              {i > 0 && bubble[i - 1].verdict !== r.verdict && (
                <div className="my-1.5 flex items-center gap-2" aria-label="Cut line">
                  <span className="h-px flex-1 bg-brass/60" />
                  <span className="font-mono text-2xs uppercase tracking-[0.14em] text-brass">cut line</span>
                  <span className="h-px flex-1 bg-brass/60" />
                </div>
              )}
              <Row row={r} />
            </div>
          ))}
        </Section>
      )}

      <Section title="Suggested to sell" meta={String(sells.length)} note="Closest calls first. Mark Sell to send one to the To Sell list; Keep locks it in.">
        {sells.length === 0 ? (
          <Empty>Nothing left to suggest at this target.</Empty>
        ) : (
          sells.filter((r) => !r.bubble).map((r) => <Row key={r.watch.id} row={r} />)
        )}
      </Section>

      <details className="group rounded-xl border border-border bg-card">
        <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm">
          <span className="font-medium text-foreground">Keeping</span>
          <span className="font-mono text-xs tabular-nums text-muted-foreground">{kept.length}</span>
        </summary>
        <div className="space-y-1.5 border-t border-border p-3">
          {kept.filter((r) => !r.bubble).map((r) => (
            <Row key={r.watch.id} row={r} />
          ))}
        </div>
      </details>

      {decided.length > 0 && (
        <details className="group rounded-xl border border-border bg-card">
          <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm">
            <span className="font-medium text-foreground">Already going</span>
            <span className="font-mono text-xs tabular-nums text-muted-foreground">{decided.length}</span>
          </summary>
          <div className="space-y-1.5 border-t border-border p-3">
            {decided.map((r) => (
              <Row key={r.watch.id} row={r} />
            ))}
          </div>
        </details>
      )}
    </div>
  )
}

function Stat({ label, value, context }: { label: string; value: string; context: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-card px-[18px] py-4">
      <span className={EYEBROW}>{label}</span>
      <span className="font-mono text-lg tabular-nums text-foreground">{value}</span>
      <span className="text-xs text-muted-foreground">{context}</span>
    </div>
  )
}

function Section({
  title,
  meta,
  note,
  children,
}: {
  title: string
  meta: string
  note?: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-2.5">
      <div className="flex items-baseline gap-2">
        <h2 className="font-display text-md font-semibold text-foreground">{title}</h2>
        <span className="font-mono text-xs tabular-nums text-muted-foreground">{meta}</span>
      </div>
      {note && <p className="text-sm text-muted-foreground">{note}</p>}
      <div className="space-y-1.5">{children}</div>
    </section>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">{children}</p>
  )
}

function Composition({ title, rows }: { title: string; rows: CompositionRow[] }) {
  const max = Math.max(1, ...rows.map((r) => r.before))
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className={cn(EYEBROW, "mb-3")}>{title} · before → after</p>
      <ul className="space-y-1.5">
        {rows.slice(0, 9).map((r) => (
          <li key={r.key} className="grid grid-cols-[110px_minmax(0,1fr)_64px] items-center gap-2 text-xs">
            <span className="truncate text-muted-foreground">{r.label}</span>
            <span className="relative h-2 overflow-hidden rounded-full bg-muted">
              <span
                className="absolute inset-y-0 left-0 rounded-full bg-muted-foreground/25"
                style={{ width: `${(r.before / max) * 100}%` }}
              />
              <span
                className="absolute inset-y-0 left-0 rounded-full bg-brass/70"
                style={{ width: `${(r.after / max) * 100}%` }}
              />
            </span>
            <span className="text-right font-mono tabular-nums text-muted-foreground">
              {r.before} → <span className="text-foreground">{r.after}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Row({ row }: { row: EditRow }) {
  const w = row.watch
  const breakdown = row.keep.components
    .map((c) => (c.key === "faceoff" ? c.label : `${c.label} (${Math.round(c.score * 100)})`))
    .join("\n")
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2",
        row.verdict === "decided" && "opacity-60"
      )}
    >
      <span className="w-7 shrink-0 text-right font-mono text-2xs tabular-nums text-muted-foreground">
        {row.rank}
      </span>
      <Link href={`/watch/${w.id}`} className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-muted">
        {w.thumbUrl && <Image src={w.thumbUrl} alt="" fill className="object-cover" sizes="44px" />}
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Link href={`/watch/${w.id}`} className="truncate text-sm font-medium text-foreground hover:underline">
            {w.name}
          </Link>
          {w.sentimental && <Heart className="h-3.5 w-3.5 shrink-0 text-brass" aria-label="Sentimental" />}
          {w.isComingSoon && <StatusPill tone="outline">Coming</StatusPill>}
          {w.saleStatus === "listed" && <StatusPill tone="solid">For sale</StatusPill>}
        </div>
        <p className="truncate text-xs text-muted-foreground">{row.reasons.join(" · ")}</p>
      </div>
      <span
        className="hidden w-12 shrink-0 text-right font-mono text-xs tabular-nums text-muted-foreground sm:block"
        title={`Keep value ${Math.round(row.keep.value * 100)} → ${Math.round(row.marginal * 100)} after crowding\n\n${breakdown}`}
      >
        {Math.round(row.marginal * 100)}
      </span>
      <span
        className="hidden w-20 shrink-0 text-right font-mono text-xs tabular-nums text-foreground md:block"
        title={w.valueSource ? VALUATION_SOURCE_LABEL[w.valueSource] : "No value"}
      >
        {w.valueCents != null ? formatCurrency(w.valueCents, "USD", true) : "—"}
      </span>
      {w.saleStatus === "listed" ? (
        <span className="w-[150px] shrink-0" />
      ) : (
        <KeepDecisionControl watchId={w.id} value={w.keepDecision} className="w-[150px] [&>button]:flex-1" />
      )}
    </div>
  )
}

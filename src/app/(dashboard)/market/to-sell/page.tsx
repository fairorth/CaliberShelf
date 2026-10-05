import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { getToSellReport, type ToSellRow } from "@/lib/queries/to-sell"
import { EditHeader } from "@/components/edit-header"
import { GainValue } from "@/components/gain-value"
import { StatusPill } from "@/components/ui/status-pill"
import { KeepDecisionControl } from "@/components/keep-decision-control"
import { VALUATION_SOURCE_LABEL } from "@/lib/valuation"
import { attachmentLabels } from "@/lib/validations/watch"
import { cn, formatCurrency } from "@/lib/utils"
import { GoalEditor } from "./_components/goal-editor"

export const metadata: Metadata = {
  title: "To Sell | TenTenLoupe",
}

export const dynamic = "force-dynamic"

const EYEBROW = "font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground"

const STAGE_LABEL: Record<ToSellRow["stage"], string> = {
  sold: "Sold",
  listed: "Listed",
  decided: "Decided",
}

function longDate(iso: string): string {
  return new Date(iso.slice(0, 10) + "T00:00:00").toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export default async function ToSellPage() {
  const { goal, rows, maybes, totals } = await getToSellReport()
  const goalCents = goal.goalCents
  const gap = goalCents != null ? goalCents - totals.totalCents : null

  // The bar: three segments in the order money becomes real. Scaled to the
  // goal, or to the total when it overshoots, so nothing ever runs off the end.
  const scale = Math.max(goalCents ?? 0, totals.totalCents, 1)
  const seg = (c: number) => `${(c / scale) * 100}%`

  // Which maybes would close the gap, most valuable first.
  const closers: ToSellRow[] = []
  if (gap != null && gap > 0) {
    let left = gap
    for (const m of maybes) {
      if (left <= 0) break
      closers.push(m)
      left -= m.netCents ?? 0
    }
  }

  return (
    <div className="space-y-6 pb-8">
      <EditHeader
        title="To Sell"
        subtitle={`${rows.length} watch${rows.length === 1 ? "" : "es"} on the way out · estimates less ${goal.feePct}% fees`}
      />

      {/* Goal */}
      <div className="space-y-4 rounded-xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <p className={EYEBROW}>{goal.label ? `Goal · ${goal.label}` : "Goal"}</p>
            <p className="font-mono text-lg tabular-nums text-foreground">
              {formatCurrency(totals.totalCents, "USD", true)}
              {goalCents != null && (
                <span className="text-muted-foreground"> of {formatCurrency(goalCents, "USD", true)}</span>
              )}
            </p>
            <p className="text-sm text-muted-foreground">
              {goalCents == null
                ? "Set a goal to see how far the sell list gets you."
                : gap! <= 0
                  ? `Reached — ${formatCurrency(-gap!, "USD", true)} over.`
                  : `${formatCurrency(gap!, "USD", true)} to go.`}
              {goal.setAt && ` Sales count from ${longDate(goal.setAt)}.`}
            </p>
          </div>
          <GoalEditor goal={goal} />
        </div>

        <div className="space-y-2">
          <div className="relative h-3 overflow-hidden rounded-full bg-muted" aria-hidden="true">
            <div className="absolute inset-y-0 left-0 flex">
              <span className="h-full bg-brass" style={{ width: seg(totals.soldCents) }} />
              <span className="h-full bg-brass/60" style={{ width: seg(totals.listedCents) }} />
              <span className="h-full bg-brass/30" style={{ width: seg(totals.decidedCents) }} />
            </div>
            {goalCents != null && totals.totalCents > goalCents && (
              <span
                className="absolute inset-y-0 w-0.5 bg-foreground"
                style={{ left: seg(goalCents) }}
                title="Goal"
              />
            )}
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
            <Legend swatch="bg-brass" label="Sold" cents={totals.soldCents} />
            <Legend swatch="bg-brass/60" label="Listed (ask)" cents={totals.listedCents} />
            <Legend swatch="bg-brass/30" label="Decided (estimate)" cents={totals.decidedCents} />
          </div>
        </div>

        {(totals.staticCount > 0 || totals.unvaluedCount > 0) && (
          <p className="text-xs text-warning">
            {totals.staticCount > 0 &&
              `${formatCurrency(totals.staticCents, "USD", true)} of this rests on ${totals.staticCount} static estimate${totals.staticCount === 1 ? "" : "s"} (purchase price × tier) — research those before counting on it. `}
            {totals.unvaluedCount > 0 &&
              `${totals.unvaluedCount} decided watch${totals.unvaluedCount === 1 ? " has" : "es have"} no value at all and count as $0.`}
          </p>
        )}
      </div>

      {/* The list */}
      <section className="space-y-2.5">
        <h2 className="font-display text-md font-semibold text-foreground">On the way out</h2>
        {rows.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
            Nothing marked Sell yet.{" "}
            <Link href="/market/edit/sort" className="underline-offset-2 hover:underline">
              Sort the piles
            </Link>{" "}
            or{" "}
            <Link href="/market/edit" className="underline-offset-2 hover:underline">
              open The Edit
            </Link>
            .
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className={cn(EYEBROW, "px-3 py-2 font-normal")}>Watch</th>
                  <th className={cn(EYEBROW, "hidden px-3 py-2 font-normal sm:table-cell")}>Stage</th>
                  <th className={cn(EYEBROW, "hidden px-3 py-2 text-right font-normal md:table-cell")}>Gross</th>
                  <th className={cn(EYEBROW, "px-3 py-2 text-right font-normal")}>Net</th>
                  <th className={cn(EYEBROW, "hidden px-3 py-2 text-right font-normal md:table-cell")}>Gain</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <ToSellTableRow key={r.id} row={r} />
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-border">
                  <td className="px-3 py-2 text-xs text-muted-foreground" colSpan={2}>
                    Total
                  </td>
                  <td className="hidden md:table-cell" />
                  <td className="px-3 py-2 text-right font-mono tabular-nums text-foreground">
                    {formatCurrency(totals.totalCents, "USD", true)}
                  </td>
                  <td className="hidden md:table-cell" />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>

      {/* Closing the gap */}
      {maybes.length > 0 && (
        <section className="space-y-2.5">
          <div className="flex items-baseline gap-2">
            <h2 className="font-display text-md font-semibold text-foreground">From the Maybe pile</h2>
            <span className="font-mono text-xs tabular-nums text-muted-foreground">{maybes.length}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {closers.length > 0
              ? `Most valuable first. The top ${closers.length} would close the gap.`
              : "Most valuable first — not counted toward the goal until you mark them Sell."}
          </p>
          <div className="space-y-1.5">
            {maybes.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "flex items-center gap-3 rounded-xl border bg-card px-3 py-2",
                  closers.includes(m) ? "border-brass/50" : "border-border"
                )}
              >
                <Thumb row={m} />
                <div className="min-w-0 flex-1">
                  <Link href={`/watch/${m.id}`} className="block truncate text-sm font-medium text-foreground hover:underline">
                    {m.name}
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    {m.attachment ? `${attachmentLabels[m.attachment]} attachment` : "Unrated"}
                    {m.source && ` · ${VALUATION_SOURCE_LABEL[m.source]}`}
                  </span>
                </div>
                <span className="font-mono text-sm tabular-nums text-foreground">
                  {m.netCents != null ? formatCurrency(m.netCents, "USD", true) : "—"}
                </span>
                <KeepDecisionControl watchId={m.id} value="maybe" />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function Legend({ swatch, label, cents }: { swatch: string; label: string; cents: number }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("h-2 w-2 rounded-full", swatch)} aria-hidden="true" />
      {label} <span className="font-mono tabular-nums text-foreground">{formatCurrency(cents, "USD", true)}</span>
    </span>
  )
}

function Thumb({ row }: { row: ToSellRow }) {
  return (
    <Link href={`/watch/${row.id}`} className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-muted">
      {row.thumbUrl && <Image src={row.thumbUrl} alt="" fill className="object-cover" sizes="40px" />}
    </Link>
  )
}

function ToSellTableRow({ row }: { row: ToSellRow }) {
  return (
    <tr className={cn("border-b border-border/60 last:border-0", row.stage === "sold" && "text-muted-foreground")}>
      <td className="px-3 py-2">
        <div className="flex items-center gap-3">
          <Thumb row={row} />
          <div className="min-w-0">
            <Link href={`/watch/${row.id}`} className="block truncate font-medium text-foreground hover:underline">
              {row.name}
            </Link>
            <span className="text-xs text-muted-foreground">
              {row.attachment ? `${attachmentLabels[row.attachment]} attachment` : "Unrated"}
              {row.stage === "decided" && row.source && ` · ${VALUATION_SOURCE_LABEL[row.source]}`}
              {row.soldAt && ` · ${longDate(row.soldAt)}`}
            </span>
          </div>
        </div>
      </td>
      <td className="hidden px-3 py-2 sm:table-cell">
        <StatusPill tone={row.stage === "sold" ? "solid" : row.stage === "listed" ? "outline" : "neutral"}>
          {STAGE_LABEL[row.stage]}
        </StatusPill>
      </td>
      <td className="hidden px-3 py-2 text-right font-mono tabular-nums text-muted-foreground md:table-cell">
        {row.stage === "sold" ? "" : row.grossCents != null ? formatCurrency(row.grossCents, "USD", true) : "—"}
      </td>
      <td className="px-3 py-2 text-right font-mono tabular-nums text-foreground">
        {row.netCents != null ? formatCurrency(row.netCents, "USD", true) : "—"}
      </td>
      <td className="hidden px-3 py-2 text-right md:table-cell">
        <GainValue gain={row.gain} wholeDollars />
      </td>
    </tr>
  )
}

import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ValuationEvidence, ConfidenceBadge } from "@/components/valuation-evidence"
import {
  getAllValuations,
  valuationRunDate,
  type ValuationWithWatch,
} from "@/lib/queries/valuations"
import { formatCurrency } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Valuation Run | CaliberShelf",
}

function formatRunDate(date: string): string {
  return new Date(date + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function watchLabel(v: ValuationWithWatch): string {
  const brand = v.watch?.brand?.name ?? ""
  const name = v.watch?.nickname || v.watch?.model || "Unknown watch"
  return `${brand} ${name}`.trim()
}

export default async function ValuationRunPage({
  params,
}: {
  params: Promise<{ date: string }>
}) {
  const { date } = await params
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound()

  const all = await getAllValuations()
  const rows = all.filter((v) => valuationRunDate(v.valued_at) === date)
  if (rows.length === 0) notFound()

  const totalMid = rows.reduce((sum, v) => sum + v.value_mid_cents, 0)
  const totalPaid = rows.reduce(
    (sum, v) => sum + (v.watch?.purchase_price_cents ?? 0),
    0
  )

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/reports/valuations"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All valuation runs
        </Link>
        <h1 className="font-display text-lg font-medium tracking-tight">
          Valuation Run — {formatRunDate(date)}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {rows.length} {rows.length === 1 ? "watch" : "watches"} valued at{" "}
          <span className="font-mono text-brass">{formatCurrency(totalMid, "USD", true)}</span>
          {totalPaid > 0 && (
            <>
              {" "}
              against {formatCurrency(totalPaid, "USD", true)} paid
            </>
          )}
          .
        </p>
      </div>

      <div className="max-w-4xl space-y-4">
        {rows.map((v) => (
          <Card key={v.id} className="overflow-hidden border-l-2 border-l-brass/40">
            <CardHeader className="pb-2">
              <CardTitle className="flex flex-wrap items-baseline justify-between gap-2 text-base">
                <Link
                  href={`/watch/${v.watch?.id}/edit`}
                  className="underline-offset-2 hover:underline"
                >
                  {watchLabel(v)}
                </Link>
                {v.watch?.reference_number && (
                  <span className="font-mono text-xs text-muted-foreground">
                    {v.watch.reference_number}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <span className="font-mono text-xl font-semibold text-brass">
                  {formatCurrency(v.value_mid_cents, v.currency, true)}
                </span>
                {v.value_low_cents != null && v.value_high_cents != null && (
                  <span className="text-sm text-muted-foreground">
                    range {formatCurrency(v.value_low_cents, v.currency, true)} –{" "}
                    {formatCurrency(v.value_high_cents, v.currency, true)}
                  </span>
                )}
                <ConfidenceBadge confidence={v.confidence} />
                {v.watch?.purchase_price_cents != null && (
                  <span
                    className={
                      v.value_mid_cents >= v.watch.purchase_price_cents
                        ? "text-sm text-emerald-600 dark:text-emerald-400"
                        : "text-sm text-rose-600 dark:text-rose-400"
                    }
                  >
                    {v.value_mid_cents >= v.watch.purchase_price_cents ? "+" : "−"}
                    {formatCurrency(
                      Math.abs(v.value_mid_cents - v.watch.purchase_price_cents),
                      v.currency,
                      true
                    )}{" "}
                    vs paid
                  </span>
                )}
              </div>

              <details className="group rounded-lg border border-border/60 px-3 py-2">
                <summary className="cursor-pointer select-none text-sm font-medium text-muted-foreground group-open:mb-3">
                  Evidence &amp; sources
                </summary>
                <ValuationEvidence valuation={v} />
              </details>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

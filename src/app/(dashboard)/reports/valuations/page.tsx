import type { Metadata } from "next"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusPill } from "@/components/ui/status-pill"
import { getAllValuations, groupValuationRuns } from "@/lib/queries/valuations"
import { STALE_VALUATION_DAYS, todayDate } from "@/lib/queries/sales"
import { daysBetween } from "@/lib/queries/gain"
import { formatCurrency } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Watch Valuations | TenTenLoupe",
}

function formatRunDate(date: string): string {
  return new Date(date + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export default async function ValuationsReportPage() {
  const valuations = await getAllValuations()
  const runs = groupValuationRuns(valuations)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-lg font-semibold tracking-tight">Watch Valuations</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Each row is a valuation run. Open a date to see every watch valued that day and
          the evidence behind each estimate.
        </p>
      </div>

      {runs.length === 0 ? (
        <Card className="max-w-2xl">
          <CardContent className="pt-6 text-sm text-muted-foreground">
            No valuation runs yet. Enable &ldquo;Price checking&rdquo; in a
            watch&rsquo;s Market card, then use &ldquo;Check price now&rdquo; on its
            watch page — runs appear here as they complete.
          </CardContent>
        </Card>
      ) : (
        <div className="max-w-2xl space-y-3">
          {runs.map((run) => {
            const ageDays = daysBetween(run.date, todayDate()) ?? 0
            return (
            <Link
              key={run.date}
              href={`/reports/valuations/${run.date}`}
              className="group block"
            >
              <Card className="transition-colors group-hover:border-primary/50">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-baseline justify-between gap-3 text-sm">
                    {formatRunDate(run.date)}
                    {ageDays > STALE_VALUATION_DAYS ? (
                      <StatusPill
                        tone="warning"
                        title={`${ageDays} days old — older than the ${STALE_VALUATION_DAYS}-day staleness threshold`}
                      >
                        Stale · {ageDays}d
                      </StatusPill>
                    ) : (
                      <span className="font-mono text-2xs uppercase tracking-[0.12em] text-muted-foreground">
                        {ageDays === 0 ? "today" : `${ageDays}d ago`}
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap items-baseline gap-x-6 gap-y-1 text-sm">
                  <span>
                    <span className="font-medium">{run.count}</span>{" "}
                    <span className="text-muted-foreground">
                      {run.count === 1 ? "watch" : "watches"} valued
                    </span>
                  </span>
                  <span className="font-mono tabular-nums text-foreground">
                    {formatCurrency(run.totalMidCents, "USD", true)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {run.confidences.high} high · {run.confidences.medium} medium ·{" "}
                    {run.confidences.low} low confidence
                  </span>
                </CardContent>
              </Card>
            </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

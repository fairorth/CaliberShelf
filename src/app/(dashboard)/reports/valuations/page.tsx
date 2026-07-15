import type { Metadata } from "next"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getAllValuations, groupValuationRuns } from "@/lib/queries/valuations"
import { formatCurrency } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Watch Valuations | CaliberShelf",
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
        <h1 className="font-display text-lg font-medium tracking-tight">Watch Valuations</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Each row is a valuation run. Open a date to see every watch valued that day and
          the evidence behind each estimate.
        </p>
      </div>

      {runs.length === 0 ? (
        <Card className="max-w-2xl">
          <CardContent className="pt-6 text-sm text-muted-foreground">
            No valuation runs yet. Flag watches with &ldquo;Perform price checking&rdquo; and run{" "}
            <code className="font-mono text-[12px]">npm run price-check</code>.
          </CardContent>
        </Card>
      ) : (
        <div className="max-w-2xl space-y-3">
          {runs.map((run) => (
            <Link
              key={run.date}
              href={`/reports/valuations/${run.date}`}
              className="group block"
            >
              <Card className="transition-colors group-hover:border-primary/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{formatRunDate(run.date)}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap items-baseline gap-x-6 gap-y-1 text-sm">
                  <span>
                    <span className="font-medium">{run.count}</span>{" "}
                    <span className="text-muted-foreground">
                      {run.count === 1 ? "watch" : "watches"} valued
                    </span>
                  </span>
                  <span className="font-mono text-brass">
                    {formatCurrency(run.totalMidCents, "USD", true)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {run.confidences.high} high · {run.confidences.medium} medium ·{" "}
                    {run.confidences.low} low confidence
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

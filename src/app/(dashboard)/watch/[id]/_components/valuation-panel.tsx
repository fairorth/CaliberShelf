import { TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ValuationEvidence, ConfidenceBadge } from "@/components/valuation-evidence"
import { formatCurrency } from "@/lib/utils"
import type { WatchValuation } from "@/lib/types/watch"

interface ValuationPanelProps {
  valuations: WatchValuation[]
  purchasePriceCents: number | null
}

function formatValuedAt(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

/**
 * Market-valuation section of the watch page. Shows the latest agent
 * estimate with its full audit trail, plus the run history. Server
 * Component — expand/collapse uses native <details>.
 */
export function ValuationPanel({ valuations, purchasePriceCents }: ValuationPanelProps) {
  const latest = valuations[0]

  return (
    <Card className="overflow-hidden border-l-4 border-l-brass/40">
      <CardHeader className="bg-gradient-to-br from-amber-50/60 via-yellow-50/20 to-transparent pb-3 dark:from-amber-950/20 dark:via-amber-900/5 dark:to-transparent">
        <CardTitle className="flex items-center gap-2.5 font-display text-[19px] font-semibold">
          <span className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-brass/15 text-brass">
            <TrendingUp className="h-4 w-4" />
          </span>
          Market Valuation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {!latest ? (
          <p className="text-sm text-muted-foreground">
            No valuations yet. Enable &ldquo;Perform price checking&rdquo; above (requires a
            reference number), then run <code className="font-mono text-[12px]">npm run price-check</code>.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <span className="font-mono text-3xl font-semibold text-brass">
                {formatCurrency(latest.value_mid_cents, latest.currency, true)}
              </span>
              {latest.value_low_cents != null && latest.value_high_cents != null && (
                <span className="text-sm text-muted-foreground">
                  range {formatCurrency(latest.value_low_cents, latest.currency, true)} –{" "}
                  {formatCurrency(latest.value_high_cents, latest.currency, true)}
                </span>
              )}
              <ConfidenceBadge confidence={latest.confidence} />
            </div>

            <p className="text-sm text-muted-foreground">
              As of {formatValuedAt(latest.valued_at)}
              {purchasePriceCents != null && (
                <>
                  {" · "}
                  <span
                    className={
                      latest.value_mid_cents >= purchasePriceCents
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    }
                  >
                    {latest.value_mid_cents >= purchasePriceCents ? "+" : "−"}
                    {formatCurrency(
                      Math.abs(latest.value_mid_cents - purchasePriceCents),
                      latest.currency,
                      true
                    )}{" "}
                    vs purchase
                  </span>
                </>
              )}
            </p>

            <details className="group rounded-lg border border-border/60 px-3 py-2">
              <summary className="cursor-pointer select-none text-sm font-medium text-muted-foreground group-open:mb-3">
                Evidence &amp; sources
              </summary>
              <ValuationEvidence valuation={latest} />
            </details>

            {valuations.length > 1 && (
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  History
                </p>
                <ul className="space-y-1 text-sm">
                  {valuations.slice(1).map((v) => (
                    <li key={v.id} className="flex items-center gap-3">
                      <span className="w-28 shrink-0 text-muted-foreground">
                        {formatValuedAt(v.valued_at)}
                      </span>
                      <span className="font-mono text-brass">
                        {formatCurrency(v.value_mid_cents, v.currency, true)}
                      </span>
                      <ConfidenceBadge confidence={v.confidence} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

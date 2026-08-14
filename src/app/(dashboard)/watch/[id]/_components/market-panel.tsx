import Link from "next/link"
import { TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusPill } from "@/components/ui/status-pill"
import { ValuationEvidence, ConfidenceBadge } from "@/components/valuation-evidence"
import { LISTING_AGING_DAYS, STALE_VALUATION_DAYS, daysBetween, todayDate } from "@/lib/queries/sales"
import { gainVersusBasis } from "@/lib/queries/portfolio"
import { formatCurrency, cn } from "@/lib/utils"
import { MarketTrendChart, type TrendPoint, type ManualPoint } from "./market-trend-chart"
import { CheckPriceButton } from "./check-price-button"
import { LogValueDialog } from "./log-value-dialog"
import { LifecycleControls } from "./lifecycle-controls"
import type { Watch, WatchListing, WatchSale, WatchValuation } from "@/lib/types/watch"

interface MarketPanelProps {
  watch: Watch & { brand: { name: string } }
  /** all rows, newest first (agent + manual). */
  valuations: WatchValuation[]
  listing: WatchListing | null
  sale: WatchSale | null
}

function formatValuedAt(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

/**
 * The watch page's Market panel (§3.3) — replaces the old valuation panel.
 * Four zones: header (latest estimate + staleness), trend, actions, and
 * basis + lifecycle. Every gain figure comes from the query helpers.
 */
export function MarketPanel({ watch, valuations, listing, sale }: MarketPanelProps) {
  const agentRows = valuations.filter((v) => v.source === "agent")
  const manualRows = valuations.filter((v) => v.source === "manual")
  const latest = agentRows[0] ?? null
  const today = todayDate()

  const staleDays = latest
    ? daysBetween(latest.valued_at.slice(0, 10), today)
    : null
  const isStale = staleDays != null && staleDays > STALE_VALUATION_DAYS

  const unrealized = latest ? gainVersusBasis(latest.value_mid_cents, watch) : null

  // Chart data, oldest first. Agent rows drive the line; manual rows overlay.
  const points: TrendPoint[] = [...agentRows]
    .reverse()
    .map((v) => ({
      t: Date.parse(v.valued_at),
      mid: v.value_mid_cents,
      band:
        v.value_low_cents != null && v.value_high_cents != null
          ? ([v.value_low_cents, v.value_high_cents] as [number, number])
          : null,
    }))
  const manualPoints: ManualPoint[] = [...manualRows].reverse().map((v) => ({
    t: Date.parse(v.valued_at),
    mid: v.value_mid_cents,
    note: v.entered_note ?? "",
  }))

  const daysListed = listing ? daysBetween(listing.listed_at, today) ?? 0 : null

  // Basis breakdown — echoes the stored components; the total is the
  // generated column, never recomputed here.
  const basisParts: string[] = []
  if (watch.purchase_price_cents != null)
    basisParts.push(`purchase ${Math.round(watch.purchase_price_cents / 100).toLocaleString()}`)
  if (watch.acq_shipping_cents)
    basisParts.push(`shipping ${Math.round(watch.acq_shipping_cents / 100).toLocaleString()}`)
  if (watch.acq_tax_cents)
    basisParts.push(`tax ${Math.round(watch.acq_tax_cents / 100).toLocaleString()}`)
  if (watch.acq_duty_cents)
    basisParts.push(`duty ${Math.round(watch.acq_duty_cents / 100).toLocaleString()}`)

  const watchName = `${watch.brand.name} ${watch.model}`.trim()
  const showLifecycle = !watch.is_wishlist && !watch.is_coming_soon

  const statusPill =
    watch.sale_status === "listed" && daysListed != null ? (
      <StatusPill tone={daysListed > LISTING_AGING_DAYS ? "warning" : "neutral"}>
        Listed · Day {daysListed}
      </StatusPill>
    ) : watch.sale_status === "candidate" ? (
      <StatusPill tone="neutral">Candidate</StatusPill>
    ) : watch.sale_status === "sold" ? (
      <StatusPill tone="neutral">Sold</StatusPill>
    ) : null

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2.5 font-display text-md font-semibold">
          <span className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <TrendingUp className="h-4 w-4" aria-hidden="true" />
          </span>
          Market
          <span className="flex-1" />
          {statusPill}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-[18px] pt-4">
        {/* ── Header row: the latest estimate ─────────────────── */}
        {latest ? (
          <div className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1.5">
            <span className="font-mono text-lg font-semibold tabular-nums text-foreground">
              {formatCurrency(latest.value_mid_cents, latest.currency, true)}
            </span>
            {latest.value_low_cents != null && latest.value_high_cents != null && (
              <span className="text-xs text-muted-foreground">
                range {formatCurrency(latest.value_low_cents, latest.currency, true)} –{" "}
                {formatCurrency(latest.value_high_cents, latest.currency, true)}
              </span>
            )}
            <ConfidenceBadge confidence={latest.confidence} />
            <span className="text-xs text-muted-foreground">
              as of {formatValuedAt(latest.valued_at)}
            </span>
            {isStale && (
              <StatusPill tone="warning" title={`Valued ${staleDays} days ago`}>
                Stale
              </StatusPill>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {watch.price_check_enabled
              ? "No estimate yet — run the first check below."
              : watch.reference_number
                ? "Not tracked. Turn on price checking on the edit form to start the monthly estimate."
                : "Not tracked. Add a reference number on the edit form, then turn on price checking."}
          </p>
        )}

        {/* ── Trend — needs ≥2 agent points, else the header stands in ── */}
        {points.length >= 2 && (
          <MarketTrendChart
            points={points}
            manualPoints={manualPoints}
            basisCents={watch.purchase_price_cents != null ? watch.cost_basis_cents : null}
            targetAskCents={watch.target_ask_cents}
          />
        )}

        {/* ── Actions ─────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2.5">
          <CheckPriceButton watchId={watch.id} trackingEnabled={watch.price_check_enabled} />
          <LogValueDialog watchId={watch.id} />
        </div>

        {latest && (
          <details className="group rounded-lg border border-border/60 px-3 py-2">
            <summary className="cursor-pointer select-none text-sm font-medium text-muted-foreground group-open:mb-3">
              Evidence &amp; sources
            </summary>
            <ValuationEvidence valuation={latest} />
          </details>
        )}

        {/* ── Basis + lifecycle ───────────────────────────────── */}
        <div className="flex flex-col gap-5 border-t border-border/60 pt-4 sm:flex-row sm:items-start">
          <div className="flex flex-1 flex-col gap-1.5">
            <p className="font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground">
              Cost basis
            </p>
            {watch.purchase_price_cents != null ? (
              <>
                <span className="font-mono text-md tabular-nums text-foreground">
                  {formatCurrency(watch.cost_basis_cents, watch.purchase_currency)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {basisParts.join(" · ")}
                </span>
              </>
            ) : (
              <>
                <span className="font-mono text-md tabular-nums text-muted-foreground">—</span>
                <span className="text-xs text-muted-foreground">
                  No purchase price recorded — add it on the edit form to track gains.
                </span>
              </>
            )}
            {unrealized && watch.sale_status !== "sold" && (
              <span className="text-xs">
                <span
                  className={cn(
                    "font-mono tabular-nums",
                    unrealized.cents >= 0 ? "text-chart-2" : "text-destructive"
                  )}
                >
                  {unrealized.cents >= 0 ? "+" : "−"}
                  {formatCurrency(Math.abs(unrealized.cents), watch.purchase_currency)}
                  {unrealized.pct != null &&
                    ` (${unrealized.cents >= 0 ? "+" : "−"}${Math.abs(unrealized.pct).toFixed(1)}%)`}
                </span>{" "}
                <span className="text-muted-foreground">unrealized vs basis</span>
              </span>
            )}
            {watch.sale_status === "sold" && sale && (
              <span className="text-xs text-muted-foreground">
                Sold — see{" "}
                <Link href="/market/sold" className="underline-offset-2 hover:underline">
                  the sold archive
                </Link>{" "}
                for the realized figures.
              </span>
            )}
          </div>

          {showLifecycle && (
            <>
              <div className="hidden w-px self-stretch bg-border/60 sm:block" aria-hidden="true" />
              <LifecycleControls
                watchId={watch.id}
                watchName={watchName}
                referenceNumber={watch.reference_number}
                saleStatus={watch.sale_status}
                candidateSince={watch.candidate_since}
                candidateNote={watch.candidate_note}
                costBasisCents={watch.cost_basis_cents}
                purchasePriceKnown={watch.purchase_price_cents != null}
                purchaseDate={watch.purchase_date}
                latestMidCents={latest?.value_mid_cents ?? null}
                latestLowCents={latest?.value_low_cents ?? null}
                latestHighCents={latest?.value_high_cents ?? null}
                listing={listing}
                daysListed={daysListed}
                sale={sale}
              />
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

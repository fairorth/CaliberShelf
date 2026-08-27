import Link from "next/link"
import { TrendingUp } from "lucide-react"
import { SectionCard } from "@/components/section-card"
import { StatusPill } from "@/components/ui/status-pill"
import { ValuationEvidence, ConfidenceBadge } from "@/components/valuation-evidence"
import { LISTING_AGING_DAYS, STALE_VALUATION_DAYS, daysBetween, todayDate } from "@/lib/queries/sales"
import { gainVersusBasis } from "@/lib/queries/portfolio"
import { formatCurrency, cn } from "@/lib/utils"
import { CheckPriceButton } from "./check-price-button"
import { LogValueDialog } from "./log-value-dialog"
import { TrackMarketToggle } from "./track-market-toggle"
import type { AgentTrace } from "@/lib/queries/agent-trace"
import type { Watch, WatchListing, WatchSale, WatchValuation } from "@/lib/types/watch"

interface MarketPanelProps {
  watch: Watch & { brand: { name: string } }
  /** all rows, newest first (agent + manual). */
  valuations: WatchValuation[]
  /** Stored trace of the most recent price-check run, if there is one. */
  trace: AgentTrace | null
  listing: WatchListing | null
  sale: WatchSale | null
}

/** Section eyebrow — the caption above each figure in this panel. */
const EYEBROW = "font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground"

function formatDuration(ms: number): string {
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s}s`
  return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`
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
export function MarketPanel({
  watch,
  valuations,
  listing,
  sale,
  trace,
}: MarketPanelProps) {
  const agentRows = valuations.filter((v) => v.source === "agent")
  const latest = agentRows[0] ?? null
  const today = todayDate()

  const staleDays = latest
    ? daysBetween(latest.valued_at.slice(0, 10), today)
    : null
  const isStale = staleDays != null && staleDays > STALE_VALUATION_DAYS

  const unrealized = latest ? gainVersusBasis(latest.value_mid_cents, watch) : null

  const daysListed = listing ? daysBetween(listing.listed_at, today) ?? 0 : null

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
    <SectionCard
      id="market"
      icon={TrendingUp}
      title="Market"
      action={statusPill}
      contentClassName="space-y-[18px]"
    >
      {/* ── What the market says it is worth ───────────────────
          Cost basis used to lead this section and has moved to Ownership: it
          restated the purchase price sitting a card above it, and the two are
          the same number unless there are acquisition costs. The gain stays
          here — it is this estimate measured against that basis, which is a
          third fact, not a repeat of either. */}
      <div className="flex flex-col gap-1">
        <p className={EYEBROW}>Current market</p>
        {latest ? (
          <>
            <div className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1.5">
              <span className="font-mono text-xs tabular-nums text-foreground">
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
          </>
        ) : (
          <>
            <span className="font-mono text-xs tabular-nums text-muted-foreground">—</span>
            {/* §2.4 — no empty state names another page in prose. It does not
                need to any more: the button that runs a check and the switch
                that enables it are both in this section. */}
            <span className="text-xs text-muted-foreground">
              {watch.price_check_enabled
                ? "No estimate yet — run the first check below."
                : "Not tracked. Turn it on below, or log a value yourself."}
            </span>
          </>
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

      {/* ── The three ways a price gets here: run the agent now, type one
          in yourself, or let the monthly run do it. They were split across
          the section; they are one decision. */}
      <div className="flex flex-wrap items-start gap-x-4 gap-y-3">
        <CheckPriceButton watchId={watch.id} trackingEnabled={watch.price_check_enabled} />
        <LogValueDialog watchId={watch.id} />
        <TrackMarketToggle
          watchId={watch.id}
          enabled={watch.price_check_enabled}
          hasReference={Boolean(watch.reference_number)}
        />
      </div>

      {latest && (
        <details className="group rounded-lg border border-border/60 px-3 py-2">
          <summary className="cursor-pointer select-none text-xs font-medium text-muted-foreground group-open:mb-3">
            Evidence &amp; sources
          </summary>
          <ValuationEvidence valuation={latest} />
        </details>
      )}

      {/* What the last run actually did. Evidence answers "where did this
          number come from"; this answers "where did the half hour go" — every
          search and fetch with its own duration, and the ones that came back
          empty or blocked marked as such. */}
      {trace && trace.rows.length > 0 && (
        <details className="group rounded-lg border border-border/60 px-3 py-2">
          <summary className="cursor-pointer select-none text-xs font-medium text-muted-foreground group-open:mb-3">
            Run trace
            <span className="ml-2 font-mono tabular-nums">
              {trace.durationMs != null ? formatDuration(trace.durationMs) : "—"}
            </span>
            <span className="ml-2">
              · {trace.webSearches} search{trace.webSearches === 1 ? "" : "es"} · $
              {(trace.costUsdMicros / 1_000_000).toFixed(2)}
            </span>
          </summary>
          <ol className="space-y-1 overflow-x-auto">
            {trace.rows.map((row, i) => (
              <li key={i} className="flex items-baseline gap-2 text-xs">
                <span className="w-14 shrink-0 font-mono text-2xs uppercase tracking-[0.1em] text-muted-foreground">
                  {(row.kind ?? "step").replace("web_", "")}
                </span>
                <span className="min-w-0 flex-1 truncate text-foreground">{row.label}</span>
                <span
                  className={cn(
                    "shrink-0 font-mono tabular-nums",
                    row.ok ? "text-muted-foreground" : "text-destructive"
                  )}
                >
                  {row.detail}
                </span>
                {row.durationMs != null && (
                  <span className="w-12 shrink-0 text-right font-mono tabular-nums text-muted-foreground">
                    {(row.durationMs / 1000).toFixed(1)}s
                  </span>
                )}
              </li>
            ))}
          </ol>
        </details>
      )}

    </SectionCard>
  )
}

import Link from "next/link"
import { TrendingUp } from "lucide-react"
import { SectionCard } from "@/components/section-card"
import { StatusPill } from "@/components/ui/status-pill"
import { ValuationEvidence, ConfidenceBadge } from "@/components/valuation-evidence"
import { LISTING_AGING_DAYS, STALE_VALUATION_DAYS, daysBetween, todayDate } from "@/lib/queries/sales"
import { gainVersusBasis } from "@/lib/queries/portfolio"
import {
  latestAgentRow,
  pickCurrentValue,
  valuationChange,
  VALUATION_SOURCE_HINT,
  VALUATION_SOURCE_LABEL,
} from "@/lib/valuation"
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
  /** The sale zone (client component), injected by the page so this panel
   *  stays a Server Component. Null for wish-list and coming-soon watches. */
  saleControls?: React.ReactNode
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
 * The watch page's Valuation panel (§3.3; called "Market" until v1.10.3).
 * Four zones: the current value with the SOURCE that produced it, the three
 * actions that can change it, the evidence and history behind it, and the sale
 * record (still here — a sale is what a valuation is ultimately for, and it
 * carries its own "Sale" eyebrow inside the card).
 *
 * Which of the three sources leads is not decided here: `pickCurrentValue`
 * owns that, and every list, total and report calls the same function.
 */
export function MarketPanel({
  watch,
  valuations,
  listing,
  sale,
  trace,
  saleControls,
}: MarketPanelProps) {
  // Which number leads is decided in src/lib/valuation.ts, not here — the same
  // call the collection, the portfolio and every report make, so this panel and
  // the rest of the app can no longer disagree about one watch.
  const current = pickCurrentValue(valuations)
  const agentRow = latestAgentRow(valuations)
  // A logged value that supersedes research: "where did the old number go" is
  // exactly the question a replaced estimate raises, so answer it in one line.
  const supersededAgent =
    current && current.source === "manual" && agentRow ? agentRow : null
  const change = valuationChange(valuations)
  // "75% of the purchase price (Tier 4)" — the rest of the stored note repeats
  // the tracking toggle sitting a few lines below it.
  const tierNote =
    current?.source === "tier"
      ? (current.row.method_notes?.split(". ")[0] ?? null)
      : null
  const today = todayDate()

  // Only a dated observation can be stale. A static estimate is not a snapshot
  // of anything, so it never ages into a warning.
  const staleDays =
    current && current.source !== "tier"
      ? daysBetween(current.valuedAt.slice(0, 10), today)
      : null
  const isStale = staleDays != null && staleDays > STALE_VALUATION_DAYS

  const unrealized = current ? gainVersusBasis(current.cents, watch) : null

  const unrealizedLine =
    unrealized && watch.sale_status !== "sold" ? (
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
    ) : null

  const daysListed = listing ? daysBetween(listing.listed_at, today) ?? 0 : null

  const statusPill =
    watch.sale_status === "listed" && daysListed != null ? (
      <StatusPill tone={daysListed > LISTING_AGING_DAYS ? "warning" : "neutral"}>
        For sale · Day {daysListed}
      </StatusPill>
    ) : watch.sale_status === "sold" ? (
      <StatusPill tone="neutral">Sold</StatusPill>
    ) : null

  return (
    <SectionCard
      id="market"
      icon={TrendingUp}
      title="Valuation"
      action={statusPill}
      contentClassName="space-y-[18px]"
    >
      {/* ── What it is worth ──────────────────────────────────
          Cost basis used to lead this section and has moved to Ownership: it
          restated the purchase price sitting a card above it, and the two are
          the same number unless there are acquisition costs. The gain stays
          here — it is this estimate measured against that basis, which is a
          third fact, not a repeat of either.

          One value leads, whatever produced it, and it says which kind it is.
          Three sources with three different claims to truth used to mean three
          screens showing three numbers for one watch. */}
      <div className="flex flex-col gap-1">
        <p className={EYEBROW}>Current value</p>
        {current ? (
          <>
            <div className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1.5">
              <span className="font-mono text-xs tabular-nums text-foreground">
                {formatCurrency(current.cents, current.row.currency, true)}
              </span>
              <StatusPill tone="neutral" title={VALUATION_SOURCE_HINT[current.source]}>
                {VALUATION_SOURCE_LABEL[current.source]}
              </StatusPill>
              {current.row.value_low_cents != null &&
                current.row.value_high_cents != null && (
                  <span className="text-xs text-muted-foreground">
                    range{" "}
                    {formatCurrency(current.row.value_low_cents, current.row.currency, true)}{" "}
                    –{" "}
                    {formatCurrency(current.row.value_high_cents, current.row.currency, true)}
                  </span>
                )}
              {current.source !== "tier" && (
                <ConfidenceBadge confidence={current.row.confidence} />
              )}
              <span className="text-xs text-muted-foreground">
                as of {formatValuedAt(current.valuedAt)}
              </span>
              {isStale && (
                <StatusPill tone="warning" title={`Valued ${staleDays} days ago`}>
                  Stale
                </StatusPill>
              )}
            </div>
            {tierNote && (
              <span className="text-xs text-muted-foreground">{tierNote}</span>
            )}
            {current.source === "manual" && current.row.entered_note && (
              <span className="text-xs text-muted-foreground">
                “{current.row.entered_note}”
              </span>
            )}
            {unrealizedLine}
            {change && (
              <span className="text-xs">
                <span
                  className={cn(
                    "font-mono tabular-nums",
                    change.cents >= 0 ? "text-chart-2" : "text-destructive"
                  )}
                >
                  {change.cents >= 0 ? "+" : "−"}
                  {formatCurrency(Math.abs(change.cents), current.row.currency)}
                  {change.pct != null &&
                    ` (${change.cents >= 0 ? "+" : "−"}${Math.abs(change.pct).toFixed(1)}%)`}
                </span>{" "}
                <span className="text-muted-foreground">
                  since {formatValuedAt(change.since)}
                </span>
              </span>
            )}
            {/* The research this value replaced. Kept to one muted line: it is
                context for the number above, not a second current value. */}
            {supersededAgent && (
              <span className="text-xs text-muted-foreground">
                Research said{" "}
                {formatCurrency(
                  supersededAgent.value_mid_cents,
                  supersededAgent.currency,
                  true
                )}{" "}
                on {formatValuedAt(supersededAgent.valued_at)}
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
                : "No purchase price to derive a static value from — add one, log a value, or turn on tracking below."}
            </span>
          </>
        )}
        {watch.sale_status === "sold" && sale && (
          <span className="text-xs text-muted-foreground">
            Sold. The realized figures are in the sale record below, and
            alongside every other sale in the{" "}
            <Link href="/reports/sales" className="underline-offset-2 hover:underline">
              Watch Sales report
            </Link>
            .
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

      {agentRow && (
        <details className="group rounded-lg border border-border/60 px-3 py-2">
          <summary className="cursor-pointer select-none text-xs font-medium text-muted-foreground group-open:mb-3">
            Evidence &amp; sources
            {supersededAgent && (
              <span className="ml-2 font-normal">· behind the researched estimate</span>
            )}
          </summary>
          <ValuationEvidence valuation={agentRow} />
        </details>
      )}

      {/* Every value this watch has ever carried, whatever produced it. Logged
          values were written to the database and rendered nowhere until now —
          "log a value" has to leave a mark you can find again. */}
      {valuations.length > 1 && (
        <details className="group rounded-lg border border-border/60 px-3 py-2">
          <summary className="cursor-pointer select-none text-xs font-medium text-muted-foreground group-open:mb-3">
            Valuation history
            <span className="ml-2 font-normal">· {valuations.length} entries</span>
          </summary>
          <ol className="space-y-1">
            {valuations.map((v) => (
              <li key={v.id} className="flex items-baseline gap-2 text-xs">
                <span className="w-24 shrink-0 font-mono text-2xs uppercase tracking-[0.1em] text-muted-foreground">
                  {formatValuedAt(v.valued_at)}
                </span>
                <span className="w-20 shrink-0 text-muted-foreground">
                  {VALUATION_SOURCE_LABEL[v.source]}
                </span>
                <span className="shrink-0 font-mono tabular-nums text-foreground">
                  {formatCurrency(v.value_mid_cents, v.currency, true)}
                </span>
                {v.entered_note && (
                  <span className="min-w-0 flex-1 truncate text-muted-foreground">
                    {v.entered_note}
                  </span>
                )}
              </li>
            ))}
          </ol>
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

      {/* ── The sale record ───────────────────────────────────
          Where the watch is in the sale flow, and every fact about the
          listing or the completed sale. This lived under Ownership until the
          sale record grew past a one-line summary; a venue, a date, an ask,
          days on market and a net-proceeds figure are market facts and belong
          in the section that owns the money. */}
      {saleControls && (
        <div className="border-t border-border/60 pt-[18px]">{saleControls}</div>
      )}
    </SectionCard>
  )
}

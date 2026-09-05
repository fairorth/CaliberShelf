import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { CircleAlert, Clock } from "lucide-react"
import {
  getPortfolioOverview,
  getPortfolioSeries,
  nextMonthlyRunLabel,
  valueMixLabel,
} from "@/lib/queries/portfolio"
import {
  getMarketAttention,
  getSalePipeline,
  LISTING_AGING_DAYS,
  RECENT_SOLD_DAYS,
  STALE_VALUATION_DAYS,
  type MarketAttentionItem,
} from "@/lib/queries/sales"
import { GainValue, GainPercent } from "@/components/gain-value"
import { saleVenueLabels } from "@/lib/validations/sale"
import { formatCurrency, cn } from "@/lib/utils"
import { PortfolioChart } from "./_components/portfolio-chart"

export const metadata: Metadata = {
  title: "Market | TenTenLoupe",
}

export const dynamic = "force-dynamic"

function shortDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
  })
}

function longDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function venueName(venue: string, other: string | null): string {
  return venue === "other" ? other || "Other" : saleVenueLabels[venue] ?? venue
}

/** One value in the portfolio strip. Numbers are foreground mono tabular;
 *  only the two delta cards pass a coloured GainValue as their value. */
function Stat({
  eyebrow,
  value,
  context,
}: {
  eyebrow: string
  value: React.ReactNode
  context: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-card px-[18px] py-4">
      <span className="font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground">
        {eyebrow}
      </span>
      <span className="font-mono text-lg tabular-nums text-foreground">{value}</span>
      <span className="text-xs text-muted-foreground">{context}</span>
    </div>
  )
}

function ColumnHeading({ label, meta }: { label: string; meta: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
      <span className="font-mono text-2xs uppercase tracking-wide text-muted-foreground/70">
        {meta}
      </span>
    </div>
  )
}

/** A pipeline card: thumbnail, identity, and the one number that matters for
 *  that column (§3.2 block 3). */
function PipelineCard({
  href,
  thumbUrl,
  name,
  subtitle,
  value,
  valueLabel,
  dimmed = false,
}: {
  href: string
  thumbUrl: string | null
  name: string
  subtitle: React.ReactNode
  value: React.ReactNode
  valueLabel: React.ReactNode
  dimmed?: boolean
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5 transition-colors hover:border-brass/50",
        dimmed && "opacity-55"
      )}
    >
      <span
        className={cn(
          "relative h-[52px] w-11 shrink-0 overflow-hidden rounded-lg bg-muted",
          dimmed && "grayscale-[0.7]"
        )}
      >
        {thumbUrl && (
          <Image src={thumbUrl} alt="" fill className="object-cover" sizes="44px" />
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate text-sm font-medium text-foreground">{name}</span>
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          {subtitle}
        </span>
      </span>
      <span className="shrink-0 text-right">
        <span className="block font-mono text-xs tabular-nums text-foreground">
          {value}
        </span>
        <span className="block font-mono text-2xs uppercase tracking-wide text-muted-foreground">
          {valueLabel}
        </span>
      </span>
    </Link>
  )
}

function EmptyColumn({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-border px-3 py-4 text-xs text-muted-foreground">
      {children}
    </p>
  )
}

/** The attention list (§3.2 block 4) — inline, no card. */
function AttentionRow({
  tone,
  children,
}: {
  tone: "warning" | "neutral"
  children: React.ReactNode
}) {
  const Icon = tone === "warning" ? Clock : CircleAlert
  return (
    <div className="flex items-start gap-2.5 text-sm text-muted-foreground">
      <Icon
        className={cn(
          "mt-0.5 h-4 w-4 shrink-0",
          tone === "warning" ? "text-warning" : "text-muted-foreground"
        )}
        aria-hidden="true"
      />
      <span>{children}</span>
    </div>
  )
}

export default async function MarketPage() {
  const [overview, series, pipeline, attention] = await Promise.all([
    getPortfolioOverview(),
    getPortfolioSeries(),
    getSalePipeline(),
    getMarketAttention(),
  ])

  const onTheBlock = pipeline.listed.length
  const chartPoints = series.points.map((p) => ({
    // "T00:00:00" pins the calendar date to LOCAL midnight. Bare "YYYY-MM-DD"
    // parses as UTC, which renders a day earlier west of Greenwich — the Aug 1
    // run was labelling itself JUL.
    t: Date.parse(p.date + "T00:00:00"),
    valueCents: p.valueCents,
  }))

  // Stale valuations collapse into one line when there are several — a list
  // of eight identical rows buries the two that are actually specific.
  const stale = attention.filter((a) => a.kind === "valuation_stale")
  const others = attention.filter((a) => a.kind !== "valuation_stale")
  const grouped: Array<MarketAttentionItem | { kind: "stale_group"; count: number }> =
    stale.length > 1
      ? [...others, { kind: "stale_group" as const, count: stale.length }]
      : [...others, ...stale]

  return (
    <div className="space-y-[26px] pb-8">
      {/* Header */}
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="font-display text-lg font-semibold tracking-tight">Market</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {overview.ownedCount} owned · {onTheBlock} on the block ·{" "}
            {overview.salesCount} sold lifetime
          </p>
        </div>
        {overview.latestRunDate && (
          <span className="font-mono text-2xs uppercase tracking-wide text-muted-foreground">
            Values as of {longDate(overview.latestRunDate)} run
          </span>
        )}
      </div>

      {/* 1 — Portfolio strip */}
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          eyebrow="Cost basis"
          value={formatCurrency(overview.costBasisCents, "USD", true)}
          context="purchase + shipping, tax, duty"
        />
        <Stat
          eyebrow="Current value"
          value={
            overview.valuedCount > 0
              ? formatCurrency(overview.currentValueCents, "USD", true)
              : "—"
          }
          context={
            overview.valuedCount > 0
              ? `${overview.valuedCount} of ${overview.ownedCount} valued · ${valueMixLabel(overview)}`
              : "no watches valued yet"
          }
        />
        <Stat
          eyebrow="Unrealized"
          value={<GainValue gain={overview.unrealized} wholeDollars />}
          context={
            overview.unrealized ? (
              <>
                <GainPercent gain={overview.unrealized} /> on valued basis
              </>
            ) : (
              "needs a valuation and a purchase price"
            )
          }
        />
        <Stat
          eyebrow="Realized"
          value={<GainValue gain={overview.realized} wholeDollars />}
          context={
            overview.salesCount > 0
              ? `${overview.salesCount} sale${overview.salesCount === 1 ? "" : "s"} · net of all fees`
              : "no sales recorded yet"
          }
        />
      </div>

      {/* 2 — Portfolio value over time */}
      <div className="rounded-xl border border-border bg-card px-5 pb-3 pt-[18px]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-md font-semibold">Portfolio value over time</h2>
          {chartPoints.length >= 2 && (
            <div className="flex items-center gap-4 font-mono text-2xs uppercase tracking-wide text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-0.5 w-4 rounded-sm bg-primary" aria-hidden="true" />
                Market value
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className="h-0 w-4 border-t border-dashed border-muted-foreground"
                  aria-hidden="true"
                />
                Cost basis
              </span>
            </div>
          )}
        </div>
        {chartPoints.length >= 2 ? (
          <div className="mt-2.5">
            <PortfolioChart points={chartPoints} basisCents={series.basisCents} />
          </div>
        ) : (
          <p className="py-3 text-sm text-muted-foreground">
            {chartPoints.length === 1
              ? `One run so far — the monthly check on ${nextMonthlyRunLabel()} draws this chart.`
              : "No valuation runs yet. Turn on price checking for a watch, then check its price from the watch page."}
          </p>
        )}
      </div>

      {/* 3 — Pipeline. Two columns since 00051 retired Candidates. */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-2.5">
          <ColumnHeading label="For sale" meta={String(pipeline.listed.length)} />
          {pipeline.listed.length === 0 ? (
            <EmptyColumn>
              Nothing for sale right now. Mark a watch for sale from its Market
              panel.
            </EmptyColumn>
          ) : (
            pipeline.listed.map((l) => (
              <PipelineCard
                key={l.watchId}
                href={`/watch/${l.watchId}`}
                thumbUrl={l.thumbUrl}
                name={l.name}
                subtitle={
                  <>
                    <span className="truncate">{venueName(l.venue, l.venueOther)}</span>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-[7px] py-px font-mono text-2xs uppercase tracking-wide ring-1",
                        l.daysOnMarket > LISTING_AGING_DAYS
                          ? "text-warning ring-warning/45"
                          : "text-muted-foreground ring-border"
                      )}
                    >
                      Day {l.daysOnMarket}
                    </span>
                  </>
                }
                value={formatCurrency(l.askPriceCents, "USD", true)}
                valueLabel="Ask"
              />
            ))
          )}
        </div>

        <div className="flex flex-col gap-2.5">
          <ColumnHeading label="Recently sold" meta={`${RECENT_SOLD_DAYS} days`} />
          {pipeline.recentlySold.length === 0 ? (
            <EmptyColumn>
              No sales in the last {RECENT_SOLD_DAYS} days.{" "}
              <Link href="/market/sold" className="underline-offset-2 hover:underline">
                See the archive
              </Link>
              .
            </EmptyColumn>
          ) : (
            pipeline.recentlySold.map((s) => (
              <PipelineCard
                key={s.watchId}
                href={`/watch/${s.watchId}`}
                thumbUrl={s.thumbUrl}
                name={s.name}
                dimmed
                subtitle={<span className="truncate">{shortDate(s.soldAt)}</span>}
                value={formatCurrency(s.netProceedsCents)}
                valueLabel={<GainValue gain={s.gain} wholeDollars />}
              />
            ))
          )}
        </div>
      </div>

      {/* 4 — Attention */}
      {grouped.length > 0 && (
        <div className="flex flex-col gap-2.5 border-t border-border pt-[18px]">
          <span className="font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground">
            Needs attention
          </span>
          {grouped.map((item, i) => {
            if (item.kind === "stale_group") {
              return (
                <AttentionRow key="stale-group" tone="warning">
                  {item.count} tracked watches were last valued over{" "}
                  {STALE_VALUATION_DAYS} days ago —{" "}
                  <Link href="/collection?price=tracked" className="underline-offset-2 hover:underline">
                    review the tracked list
                  </Link>
                  .
                </AttentionRow>
              )
            }
            const a = item as MarketAttentionItem
            return (
              <AttentionRow
                key={`${a.kind}-${a.watchId}-${i}`}
                tone={a.kind === "sale_missing_fees" ? "neutral" : "warning"}
              >
                {a.kind === "listing_aging" && (
                  <>
                    {a.name} has been {a.detail} —{" "}
                    <Link href={a.href} className="underline-offset-2 hover:underline">
                      drop the ask or withdraw
                    </Link>
                    .
                  </>
                )}
                {a.kind === "valuation_stale" && (
                  <>
                    {a.name} has a {a.detail} —{" "}
                    <Link href={a.href} className="underline-offset-2 hover:underline">
                      run a check
                    </Link>
                    .
                  </>
                )}
                {a.kind === "sale_missing_fees" && (
                  <>
                    {a.name} sold with no fee data, so its net is overstated —{" "}
                    <Link href={a.href} className="underline-offset-2 hover:underline">
                      add the fees
                    </Link>
                    .
                  </>
                )}
              </AttentionRow>
            )
          })}
        </div>
      )}
    </div>
  )
}

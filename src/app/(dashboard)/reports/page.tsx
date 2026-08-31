import type { Metadata } from "next"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getAttentionReport } from "@/lib/queries/attention"
import { getAgentReview, formatUsdMicros } from "@/lib/queries/agent-runs"
import { getAllValuations, valuationRunDate } from "@/lib/queries/valuations"
import { getForSaleReport, getRealizedGains } from "@/lib/queries/sales"
import { GainValue } from "@/components/gain-value"
import { formatCurrency } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Reports | TenTenLoupe",
}

export const dynamic = "force-dynamic"

interface ReportLink {
  slug: string
  title: string
  description: string
  available: boolean
  /** Live value line, when the report has one worth surfacing (A5).
   *  A node so a gain can render through <GainValue> (§4.3). */
  live?: React.ReactNode
}

function fmtRunDate(date: string): string {
  return new Date(date + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function ReportCard({ report }: { report: ReportLink }) {
  const body = (
    <Card
      className={
        report.available
          ? "h-full transition-colors group-hover:border-primary/50"
          : "h-full opacity-60"
      }
    >
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2 text-sm">
          {report.title}
          {!report.available && (
            <span className="rounded-full px-2 py-0.5 text-2xs font-medium text-brass ring-1 ring-brass/45">
              Coming soon
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-muted-foreground">{report.description}</p>
        {report.live && (
          <p className="font-mono text-xs tabular-nums text-foreground">{report.live}</p>
        )}
      </CardContent>
    </Card>
  )

  // The unbuilt report is not a link — no card leads to a placeholder (A5).
  if (!report.available) return <div>{body}</div>
  return (
    <Link href={`/reports/${report.slug}`} className="group block">
      {body}
    </Link>
  )
}

export default async function ReportsPage() {
  const [attention, agentReview, valuations, realizedGains, forSale] =
    await Promise.all([
      getAttentionReport(),
      getAgentReview(),
      getAllValuations(),
      getRealizedGains(),
      getForSaleReport(),
    ])

  const attentionCount =
    attention.brands.length + attention.movements.length + attention.watches.length
  const { runs, kpis } = agentReview
  const lastRun = runs[0]
  const lastValuation = valuations[0]

  // Ranked, not nine equal cards: daily reports first, then the analyses,
  // then the meta-report, with the unbuilt card last and non-interactive.
  const daily: ReportLink[] = [
    {
      slug: "collection-summary",
      title: "Collection Summary",
      description: "Counts, watches needing details, and total collection value.",
      available: true,
    },
    {
      slug: "attention-needed",
      title: "Attention Needed",
      description:
        "Brands, movements, and watches with missing critical information — click through to fix each one.",
      available: true,
      live:
        attentionCount === 0
          ? "ALL CLEAR"
          : `${attentionCount} OPEN ITEM${attentionCount === 1 ? "" : "S"}`,
    },
  ]

  const analyses: ReportLink[] = [
    {
      slug: "watch-list",
      title: "Watch List",
      description:
        "The full schedule — every watch with reference, cost and current value. Prints to PDF; exports CSV/Excel.",
      available: true,
    },
    {
      slug: "collection-map",
      title: "Collection Map",
      description:
        "Where your collection is dense and where the gaps are — size × dial color, distributions, and a diameter/thickness scatter.",
      available: true,
    },
    {
      slug: "by-category",
      title: "Watches by Category",
      description:
        "Every category with its watches and a price subtotal, plus the collection total.",
      available: true,
    },
    {
      slug: "box",
      title: "Watches by Box",
      description:
        "Every storage box with the watches it holds and a price subtotal — collapsible.",
      available: true,
    },
    {
      slug: "brand-wishlist",
      title: "Brand Wish List",
      description:
        "Brands you want but don't own from yet, with ChronoScout catalog context and best-fit models.",
      available: true,
    },
    {
      slug: "valuations",
      title: "Watch Valuations",
      description:
        "Agent-researched market values by run date, with drill-down to evidence.",
      available: true,
      live: lastValuation
        ? `LAST RUN ${fmtRunDate(valuationRunDate(lastValuation.valued_at)).toUpperCase()}`
        : undefined,
    },
    {
      slug: "sales",
      title: "Watch Sales",
      description:
        "Everything on the market now, and per-sale P&L by year — gross, fees, net, and realized gain against cost basis.",
      available: true,
      live:
        forSale.totals.count > 0 || realizedGains.lifetime.salesCount > 0 ? (
          <>
            {forSale.totals.count > 0 && (
              <>
                {forSale.totals.count} FOR SALE ·{" "}
                {formatCurrency(forSale.totals.askCents, "USD", true)} ASKING
                {realizedGains.lifetime.salesCount > 0 ? " · " : ""}
              </>
            )}
            {realizedGains.lifetime.salesCount > 0 && (
              <>
                LIFETIME <GainValue gain={realizedGains.lifetime.gain} wholeDollars /> ·{" "}
                {realizedGains.lifetime.salesCount} SALE
                {realizedGains.lifetime.salesCount === 1 ? "" : "S"}
              </>
            )}
          </>
        ) : undefined,
    },
    {
      slug: "annual-summary",
      title: "Annual Summary",
      description:
        "The records and tax view — one year's acquisitions, sales, position and fees. Prints on Letter, CSV per section.",
      available: true,
    },
  ]

  const meta: ReportLink[] = [
    {
      slug: "agents",
      title: "Agent Execution Review",
      description:
        "Every automated agent run — duration, cost, and items changed, with drill-down to full audit trails.",
      available: true,
      live: lastRun
        ? `LAST RUN ${new Date(lastRun.started_at)
            .toLocaleDateString("en-US", { month: "short", day: "numeric" })
            .toUpperCase()} · ${formatUsdMicros(kpis.costMicros30d)} / 30D`
        : undefined,
    },
    {
      slug: "wear-summary",
      title: "Wear Summary",
      description: "How often and how recently you wear each watch.",
      available: false,
    },
  ]

  return (
    <div className="space-y-6">
      <h1 className="font-display text-lg font-semibold tracking-tight">Reports</h1>

      <div className="max-w-3xl space-y-6">
        <section className="space-y-3">
          <h2 className="font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground">
            Daily
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {daily.map((r) => (
              <ReportCard key={r.slug} report={r} />
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground">
            Analysis
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {analyses.map((r) => (
              <ReportCard key={r.slug} report={r} />
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground">
            System
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {meta.map((r) => (
              <ReportCard key={r.slug} report={r} />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

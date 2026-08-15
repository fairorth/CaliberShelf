import type { Metadata } from "next"
import Link from "next/link"
import { getAnnualSummary, type AnnualSummary } from "@/lib/queries/sales"
import { GainValue } from "@/components/gain-value"
import { saleVenueLabels } from "@/lib/validations/sale"
import { cn, formatCurrency } from "@/lib/utils"
import { CopyCsvButton } from "./_components/copy-csv-button"

export const metadata: Metadata = {
  title: "Annual Summary | TenTenLoupe",
}

export const dynamic = "force-dynamic"

function venueName(venue: string, other: string | null): string {
  return venue === "other" ? other || "Other" : saleVenueLabels[venue] ?? venue
}

// ── CSV assembly (server-side; dollars with cents, RFC-ish quoting) ──

function csvCell(v: string | number | null): string {
  if (v == null) return ""
  const s = typeof v === "number" ? (v / 100).toFixed(2) : v
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function csv(rows: Array<Array<string | number | null>>): string {
  return rows.map((r) => r.map(csvCell).join(",")).join("\n")
}

function acquisitionsCsv(s: AnnualSummary): string {
  return csv([
    ["purchase_date", "watch", "purchase_price", "acq_costs", "cost_basis"],
    ...s.acquisitions.rows.map((r) => [
      r.purchaseDate,
      r.name,
      r.purchasePriceCents,
      r.acqCostsCents,
      r.costBasisCents,
    ]),
    ["total", "", null, null, s.acquisitions.totalInvestedCents],
  ])
}

function salesCsv(s: AnnualSummary): string {
  return csv([
    [
      "sold_date",
      "watch",
      "venue",
      "cost_basis",
      "sale_price",
      "fees",
      "net_proceeds",
      "realized_gain",
    ],
    ...s.sales.rows.map((r) => [
      r.soldAt,
      r.name,
      venueName(r.venue, r.venueOther),
      r.basisKnown ? r.costBasisCents : null,
      r.salePriceCents,
      r.feesCents,
      r.netProceedsCents,
      r.gain ? r.gain.cents : null,
    ]),
    [
      "total",
      "",
      "",
      null,
      s.sales.totals.salePriceCents,
      s.sales.totals.feesCents,
      s.sales.totals.netProceedsCents,
      s.sales.totals.gain ? s.sales.totals.gain.cents : null,
    ],
  ])
}

function feesCsv(s: AnnualSummary): string {
  return csv([
    ["venue", "fees"],
    ...s.feesByVenue.map((v) => [venueName(v.venue, v.venueOther), v.feesCents]),
    ["total", s.feesTotalCents],
  ])
}

// ── Layout pieces (mock screen 05) ──────────────────────────────

function SectionHeader({
  label,
  csv: csvText,
  csvLabel,
}: {
  label: string
  csv?: string
  csvLabel?: string
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
      <span className="h-px flex-1 bg-border" />
      {csvText != null && csvLabel && <CopyCsvButton csv={csvText} label={csvLabel} />}
    </div>
  )
}

function Line({
  label,
  value,
  secondary = false,
  total = false,
}: {
  label: React.ReactNode
  value: React.ReactNode
  secondary?: boolean
  total?: boolean
}) {
  return (
    <div
      className={cn(
        "flex items-baseline justify-between gap-4",
        secondary && "text-xs text-muted-foreground",
        !secondary && "text-sm",
        total && "border-t border-border pt-1.5"
      )}
    >
      <span className={cn(total && "text-muted-foreground")}>{label}</span>
      <span className="font-mono tabular-nums text-foreground">{value}</span>
    </div>
  )
}

/**
 * The records/tax view (§4.2, mock screen 05): one year's acquisitions,
 * sales, position and fees. Every figure comes from getAnnualSummary — the
 * page renders shapes and derives nothing but per-venue sale counts for the
 * fee labels. Print-clean on Letter: no card chrome in print, hairlines only,
 * with the selector, CSV buttons and back link hidden.
 */
export default async function AnnualSummaryPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>
}) {
  const { year: yearParam } = await searchParams
  const requested = yearParam ? parseInt(yearParam, 10) : undefined
  const summary = await getAnnualSummary(
    Number.isNaN(requested) ? undefined : requested
  )

  if (!summary) {
    return (
      <div className="space-y-5">
        <Link
          href="/reports"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ‹ Reports
        </Link>
        <h1 className="font-display text-lg font-semibold tracking-tight">
          Annual Summary
        </h1>
        <p className="max-w-xl rounded-xl border border-dashed border-border px-5 py-8 text-sm text-muted-foreground">
          Nothing to summarize yet — the report draws its years from purchase dates
          and recorded sales, and none exist so far.
        </p>
      </div>
    )
  }

  const purchasesCents = summary.acquisitions.rows.reduce(
    (sum, r) => sum + (r.purchasePriceCents ?? 0),
    0
  )
  const acqCostsCents = summary.acquisitions.rows.reduce(
    (sum, r) => sum + r.acqCostsCents,
    0
  )
  const soldBasisCents = summary.sales.rows.reduce(
    (sum, r) => sum + r.costBasisCents,
    0
  )
  const salesCountByVenue = new Map<string, number>()
  for (const r of summary.sales.rows) {
    const key = `${r.venue}:${r.venueOther ?? ""}`
    salesCountByVenue.set(key, (salesCountByVenue.get(key) ?? 0) + 1)
  }

  return (
    <div className="space-y-5 pb-8 print:space-y-0 print:pb-0">
      <Link
        href="/reports"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground print:hidden"
      >
        ‹ Reports
      </Link>

      <div className="max-w-2xl space-y-5 rounded-xl border border-border bg-card p-6 print:max-w-none print:space-y-4 print:rounded-none print:border-0 print:bg-transparent print:p-0">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-lg font-semibold tracking-tight">
              Annual Summary {summary.year}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Bought, sold, held and paid in fees — the year in one page.
            </p>
          </div>
          {summary.availableYears.length > 1 && (
            <nav
              aria-label="Year"
              className="flex overflow-hidden rounded-lg border border-border print:hidden"
            >
              {summary.availableYears.map((y, i) => (
                <Link
                  key={y}
                  href={`/reports/annual-summary?year=${y}`}
                  aria-current={y === summary.year ? "page" : undefined}
                  className={cn(
                    "px-3 py-1.5 text-xs transition-colors",
                    i > 0 && "border-l border-border",
                    y === summary.year
                      ? "bg-brass/15 font-medium text-brass"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {y}
                </Link>
              ))}
            </nav>
          )}
        </div>

        <section className="space-y-2.5">
          <SectionHeader
            label="1 · Acquisitions"
            csv={acquisitionsCsv(summary)}
            csvLabel="acquisitions"
          />
          <div className="space-y-1.5">
            <Line
              label={`${summary.acquisitions.rows.length} ${
                summary.acquisitions.rows.length === 1 ? "watch" : "watches"
              } bought`}
              value={formatCurrency(purchasesCents)}
            />
            <Line
              label="Acquisition costs — shipping, tax, duty"
              value={formatCurrency(acqCostsCents)}
              secondary
            />
            <Line
              label="Total invested"
              value={formatCurrency(summary.acquisitions.totalInvestedCents)}
              total
            />
          </div>
        </section>

        <section className="space-y-2.5">
          <SectionHeader label="2 · Sales" csv={salesCsv(summary)} csvLabel="sales" />
          <div className="space-y-1.5">
            <Line
              label={`${summary.sales.totals.salesCount} ${
                summary.sales.totals.salesCount === 1 ? "watch" : "watches"
              } sold · gross`}
              value={formatCurrency(summary.sales.totals.salePriceCents)}
            />
            <Line
              label="Net proceeds after fees and shipping"
              value={formatCurrency(summary.sales.totals.netProceedsCents)}
              secondary
            />
            <Line
              label="Cost basis of watches sold"
              value={formatCurrency(soldBasisCents)}
              secondary
            />
            <Line
              label="Realized gain"
              value={<GainValue gain={summary.sales.totals.gain} className="text-sm" />}
              total
            />
          </div>
        </section>

        <section className="space-y-2.5">
          <SectionHeader label="3 · Position at year end" />
          <div className="space-y-1.5">
            <Line
              label={`${summary.position.countOwned} ${
                summary.position.countOwned === 1 ? "watch" : "watches"
              } owned · cost basis`}
              value={formatCurrency(summary.position.costBasisCents)}
            />
            <Line
              label="Current market value — tracked watches"
              value={formatCurrency(summary.position.currentValueCents)}
              secondary
            />
            <Line
              label="Unrealized gain"
              value={
                <GainValue
                  gain={summary.position.unrealized}
                  showPct
                  className="text-sm"
                />
              }
              total
            />
          </div>
        </section>

        <section className="space-y-2.5">
          <SectionHeader
            label="4 · Fees paid, by venue"
            csv={feesCsv(summary)}
            csvLabel="fees"
          />
          <div className="space-y-1.5">
            {summary.feesByVenue.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No sales this year, so no fees.
              </p>
            ) : (
              <>
                {summary.feesByVenue.map((v) => {
                  const count =
                    salesCountByVenue.get(`${v.venue}:${v.venueOther ?? ""}`) ?? 0
                  return (
                    <Line
                      key={`${v.venue}:${v.venueOther ?? ""}`}
                      label={
                        <>
                          {venueName(v.venue, v.venueOther)}{" "}
                          <span className="text-xs text-muted-foreground">
                            · {count} sale{count === 1 ? "" : "s"}
                          </span>
                        </>
                      }
                      value={formatCurrency(v.feesCents)}
                    />
                  )
                })}
                <Line
                  label="Cost of doing business"
                  value={formatCurrency(summary.feesTotalCents)}
                  total
                />
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

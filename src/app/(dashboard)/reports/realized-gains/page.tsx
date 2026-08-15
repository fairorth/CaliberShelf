import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { getRealizedGains, type SaleTotals } from "@/lib/queries/sales"
import { GainValue } from "@/components/gain-value"
import { saleVenueLabels } from "@/lib/validations/sale"
import { formatCurrency, formatHoldDays } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Realized Gains | TenTenLoupe",
}

export const dynamic = "force-dynamic"

/** "12 AUG" — the compact sold-date of the mock (screen 04). */
function soldDay(iso: string): string {
  const d = new Date(iso + "T00:00:00")
  const month = d.toLocaleDateString("en-US", { month: "short" }).toUpperCase()
  return `${String(d.getDate()).padStart(2, "0")} ${month}`
}

function venueName(venue: string, other: string | null): string {
  return venue === "other" ? other || "Other" : saleVenueLabels[venue] ?? venue
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
      <span className="font-mono text-md tabular-nums text-foreground">{children}</span>
    </div>
  )
}

function YearHeaderRow({ year, subtotal }: { year: number; subtotal: SaleTotals }) {
  return (
    <tr className="border-b border-border bg-muted/40">
      <td colSpan={8} className="px-3 py-2">
        <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="font-display text-md font-semibold">{year}</span>
          <span className="font-mono text-2xs uppercase tracking-[0.12em] text-muted-foreground">
            {subtotal.salesCount} sale{subtotal.salesCount === 1 ? "" : "s"} · net{" "}
            {formatCurrency(subtotal.netProceedsCents)} ·
          </span>
          <GainValue gain={subtotal.gain} className="text-2xs" />
        </span>
      </td>
    </tr>
  )
}

const TH =
  "px-3 py-2.5 font-mono text-2xs font-normal uppercase tracking-[0.12em] text-muted-foreground"
const TD_NUM = "px-3 py-2.5 text-right font-mono text-xs tabular-nums text-foreground"

/**
 * Per-sale P&L grouped by year (§4.1, mock screen 04). Every figure comes
 * from queries/sales.ts — this page renders shapes and computes nothing but
 * the average-hold display aggregate.
 */
export default async function RealizedGainsPage() {
  const { years, lifetime } = await getRealizedGains()

  const allRows = years.flatMap((y) => y.rows)
  const heldDays = allRows
    .map((r) => r.heldDays)
    .filter((d): d is number => d != null)
  const avgHoldDays =
    heldDays.length > 0
      ? Math.round(heldDays.reduce((sum, d) => sum + d, 0) / heldDays.length)
      : null

  return (
    <div className="space-y-5 pb-8">
      <Link
        href="/reports"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        ‹ Reports
      </Link>

      <div>
        <h1 className="font-display text-lg font-semibold tracking-tight">
          Realized Gains
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Every sale, net of venue and processing fees and shipping, against cost
          basis at acquisition.
        </p>
      </div>

      {lifetime.salesCount === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-5 py-8 text-sm text-muted-foreground">
          No sales recorded yet. When a listed watch sells, record it from the watch
          page&rsquo;s Market panel and its P&amp;L will appear here.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap gap-x-8 gap-y-4 rounded-xl border border-border bg-card px-5 py-4">
            <Stat label="Sales">{lifetime.salesCount}</Stat>
            <Stat label="Gross">{formatCurrency(lifetime.salePriceCents)}</Stat>
            <Stat label="Fees">{formatCurrency(lifetime.feesCents)}</Stat>
            <Stat label="Net">{formatCurrency(lifetime.netProceedsCents)}</Stat>
            <Stat label="Realized">
              <GainValue gain={lifetime.gain} className="text-md" />
            </Stat>
            <Stat label="Win rate">
              {lifetime.winCount} / {lifetime.salesCount}
            </Stat>
            <Stat label="Avg hold">{formatHoldDays(avgHoldDays)}</Stat>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full min-w-[860px] border-collapse text-left">
              <thead>
                <tr className="border-b border-border">
                  <th className={TH} scope="col">
                    Sold
                  </th>
                  <th className={TH} scope="col">
                    Watch
                  </th>
                  <th className={`${TH} text-right`} scope="col">
                    Basis
                  </th>
                  <th className={`${TH} text-right`} scope="col">
                    Sale
                  </th>
                  <th className={`${TH} text-right`} scope="col">
                    Fees
                  </th>
                  <th className={`${TH} text-right`} scope="col">
                    Net
                  </th>
                  <th className={`${TH} text-right`} scope="col">
                    Realized
                  </th>
                  <th className={`${TH} text-right`} scope="col">
                    Held
                  </th>
                </tr>
              </thead>
              {years.map((y) => (
                <tbody key={y.year}>
                  <YearHeaderRow year={y.year} subtotal={y.subtotal} />
                  {y.rows.map((r) => (
                    <tr
                      key={r.saleId}
                      className="border-b border-border/60 last:border-b-0 hover:bg-accent/40"
                    >
                      <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">
                        {soldDay(r.soldAt)}
                      </td>
                      <td className="max-w-[300px] px-3 py-2.5">
                        <span className="flex items-center gap-2.5">
                          <span className="relative block h-8 w-[26px] shrink-0 overflow-hidden rounded-md bg-muted grayscale-[0.7]">
                            {r.thumbUrl && (
                              <Image
                                src={r.thumbUrl}
                                alt=""
                                fill
                                className="object-cover"
                                sizes="26px"
                              />
                            )}
                          </span>
                          <span className="min-w-0">
                            <Link
                              href={`/watch/${r.watchId}`}
                              className="text-sm text-foreground underline-offset-2 hover:underline"
                            >
                              {r.name}
                            </Link>{" "}
                            <span className="whitespace-nowrap text-xs text-muted-foreground">
                              · {venueName(r.venue, r.venueOther)}
                            </span>
                          </span>
                        </span>
                      </td>
                      <td className={TD_NUM}>
                        {r.basisKnown ? formatCurrency(r.costBasisCents) : "—"}
                      </td>
                      <td className={TD_NUM}>{formatCurrency(r.salePriceCents)}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-xs tabular-nums text-muted-foreground">
                        {formatCurrency(r.feesCents)}
                      </td>
                      <td className={TD_NUM}>{formatCurrency(r.netProceedsCents)}</td>
                      <td className="px-3 py-2.5 text-right">
                        <GainValue gain={r.gain} showPct className="text-xs" />
                      </td>
                      <td
                        className="px-3 py-2.5 text-right font-mono text-xs text-muted-foreground"
                        title={r.heldDays != null ? `${r.heldDays} days` : undefined}
                      >
                        {formatHoldDays(r.heldDays)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              ))}
            </table>
          </div>
        </>
      )}
    </div>
  )
}

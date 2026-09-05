import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import {
  getForSaleReport,
  getRealizedGains,
  type SaleTotals,
} from "@/lib/queries/sales"
import { GainValue } from "@/components/gain-value"
import { StatusPill } from "@/components/ui/status-pill"
import { saleVenueLabels } from "@/lib/validations/sale"
import { attachmentLabels } from "@/lib/validations/watch"
import { formatCurrency, formatHoldDays } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Watch Sales | TenTenLoupe",
}

export const dynamic = "force-dynamic"

/** "12 AUG" — the compact date used down both tables. */
function shortDay(iso: string): string {
  const d = new Date(iso + "T00:00:00")
  const month = d.toLocaleDateString("en-US", { month: "short" }).toUpperCase()
  return `${String(d.getDate()).padStart(2, "0")} ${month}`
}

function venueName(venue: string, other: string | null): string {
  return venue === "other" ? other || "Other" : (saleVenueLabels[venue] ?? venue)
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

/** The thumbnail + linked name cell both tables share. */
function WatchCell({
  thumbUrl,
  name,
  href,
  detail,
  dimmed,
}: {
  thumbUrl: string | null
  name: string
  href: string
  detail: string
  dimmed?: boolean
}) {
  return (
    <td className="max-w-[300px] px-3 py-2.5">
      <span className="flex items-center gap-2.5">
        <span
          className={
            dimmed
              ? "relative block h-8 w-[26px] shrink-0 overflow-hidden rounded-md bg-muted grayscale-[0.7]"
              : "relative block h-8 w-[26px] shrink-0 overflow-hidden rounded-md bg-muted"
          }
        >
          {thumbUrl && (
            <Image src={thumbUrl} alt="" fill className="object-cover" sizes="26px" />
          )}
        </span>
        <span className="min-w-0">
          <Link
            href={href}
            className="text-sm text-foreground underline-offset-2 hover:underline"
          >
            {name}
          </Link>{" "}
          <span className="whitespace-nowrap text-xs text-muted-foreground">
            · {detail}
          </span>
        </span>
      </span>
    </td>
  )
}

const TH =
  "px-3 py-2.5 font-mono text-2xs font-normal uppercase tracking-[0.12em] text-muted-foreground"
const TD_NUM = "px-3 py-2.5 text-right font-mono text-xs tabular-nums text-foreground"
const TD_MUTED =
  "px-3 py-2.5 text-right font-mono text-xs tabular-nums text-muted-foreground"

/**
 * The Watch Sales report: what is on the market now, and what has already
 * sold. It absorbed the old Realized Gains report — a completed sale and an
 * open listing are two halves of one story, and keeping them on separate
 * pages meant the same P&L lived in two places.
 *
 * Every figure comes from queries/sales.ts. This page renders shapes and
 * computes nothing but the average-hold display aggregate.
 */
export default async function WatchSalesPage() {
  const [forSale, { years, lifetime }] = await Promise.all([
    getForSaleReport(),
    getRealizedGains(),
  ])

  const allRows = years.flatMap((y) => y.rows)
  const heldDays = allRows.map((r) => r.heldDays).filter((d): d is number => d != null)
  const avgHoldDays =
    heldDays.length > 0
      ? Math.round(heldDays.reduce((sum, d) => sum + d, 0) / heldDays.length)
      : null

  return (
    <div className="space-y-6 pb-8">
      <Link
        href="/reports"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        &lsaquo; Reports
      </Link>

      <div>
        <h1 className="font-display text-lg font-semibold tracking-tight">
          Watch Sales
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          What is on the market now, and every sale already closed — net of
          venue and processing fees, shipping and insurance, against cost basis
          at acquisition.
        </p>
      </div>

      {/* ── Section 1: currently for sale ───────────────────────── */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-display text-md font-semibold tracking-tight">
            Currently for sale
          </h2>
          <span className="font-mono text-2xs uppercase tracking-[0.12em] text-muted-foreground">
            {forSale.totals.count} watch{forSale.totals.count === 1 ? "" : "es"}
          </span>
        </div>

        {forSale.totals.count === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-5 py-8 text-sm text-muted-foreground">
            Nothing is for sale right now. Mark a watch for sale from its Market
            panel and it will appear here.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap gap-x-8 gap-y-4 rounded-xl border border-border bg-card px-5 py-4">
              <Stat label="For sale">{forSale.totals.count}</Stat>
              <Stat label="Asking">{formatCurrency(forSale.totals.askCents)}</Stat>
              <Stat label="Basis">
                {formatCurrency(forSale.totals.costBasisCents)}
              </Stat>
              <Stat label="Est. value">
                {forSale.totals.currentValueCents > 0
                  ? formatCurrency(forSale.totals.currentValueCents)
                  : "—"}
              </Stat>
              <Stat label="Gain at ask">
                <GainValue gain={forSale.totals.gainAtAsk} className="text-md" />
              </Stat>
            </div>

            <div className="overflow-x-auto rounded-xl border border-border bg-card">
              <table className="w-full min-w-[900px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-border">
                    <th className={TH} scope="col">
                      Listed
                    </th>
                    <th className={TH} scope="col">
                      Watch
                    </th>
                    <th className={TH} scope="col">
                      Attachment
                    </th>
                    <th className={`${TH} text-right`} scope="col">
                      Basis
                    </th>
                    <th className={`${TH} text-right`} scope="col">
                      Asking
                    </th>
                    <th className={`${TH} text-right`} scope="col">
                      Est. value
                    </th>
                    <th className={`${TH} text-right`} scope="col">
                      Ask vs est.
                    </th>
                    <th className={`${TH} text-right`} scope="col">
                      Gain at ask
                    </th>
                    <th className={`${TH} text-right`} scope="col">
                      On market
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {forSale.rows.map((r) => (
                    <tr
                      key={r.listingId}
                      className="border-b border-border/60 last:border-b-0 hover:bg-accent/40"
                    >
                      <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">
                        {shortDay(r.listedAt)}
                      </td>
                      <WatchCell
                        thumbUrl={r.thumbUrl}
                        name={r.name}
                        href={`/watch/${r.watchId}`}
                        detail={venueName(r.venue, r.venueOther)}
                      />
                      <td className="px-3 py-2.5 text-xs text-muted-foreground">
                        {r.attachment ? attachmentLabels[r.attachment] : "—"}
                      </td>
                      <td className={TD_NUM}>
                        {r.basisKnown ? formatCurrency(r.costBasisCents) : "—"}
                      </td>
                      <td className={TD_NUM}>{formatCurrency(r.askPriceCents)}</td>
                      <td className={TD_MUTED}>
                        {r.currentValueCents != null
                          ? formatCurrency(r.currentValueCents)
                          : "—"}
                      </td>
                      <td className={TD_MUTED}>
                        {r.askVsValuePct != null
                          ? `${r.askVsValuePct >= 0 ? "+" : "−"}${Math.abs(r.askVsValuePct).toFixed(1)}%`
                          : "—"}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <GainValue gain={r.gainAtAsk} showPct className="text-xs" />
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        {r.aging ? (
                          <StatusPill tone="warning">{r.daysOnMarket}d</StatusPill>
                        ) : (
                          <span className="font-mono text-xs tabular-nums text-muted-foreground">
                            {r.daysOnMarket}d
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="max-w-2xl text-xs text-muted-foreground">
              Gain at ask is the asking price against cost basis,{" "}
              <em>before</em> any fees — fees are unknown until the sale
              happens. Estimated value is the latest agent-researched mid.
            </p>
          </>
        )}
      </section>

      {/* ── Section 2: completed sales ──────────────────────────── */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-display text-md font-semibold tracking-tight">
            Completed sales
          </h2>
          <span className="font-mono text-2xs uppercase tracking-[0.12em] text-muted-foreground">
            {lifetime.salesCount} sale{lifetime.salesCount === 1 ? "" : "s"}
          </span>
        </div>

        {lifetime.salesCount === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-5 py-8 text-sm text-muted-foreground">
            No sales recorded yet. When a watch that is for sale sells, record
            it from the watch page&rsquo;s Valuation panel and its P&amp;L will
            appear here.
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
                          {shortDay(r.soldAt)}
                        </td>
                        <WatchCell
                          thumbUrl={r.thumbUrl}
                          name={r.name}
                          href={`/watch/${r.watchId}`}
                          detail={venueName(r.venue, r.venueOther)}
                          dimmed
                        />
                        <td className={TD_NUM}>
                          {r.basisKnown ? formatCurrency(r.costBasisCents) : "—"}
                        </td>
                        <td className={TD_NUM}>{formatCurrency(r.salePriceCents)}</td>
                        <td className={TD_MUTED}>{formatCurrency(r.feesCents)}</td>
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
      </section>
    </div>
  )
}

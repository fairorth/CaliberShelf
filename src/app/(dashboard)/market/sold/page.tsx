import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { getSoldArchive } from "@/lib/queries/sales"
import { GainValue } from "@/components/gain-value"
import { saleVenueLabels } from "@/lib/validations/sale"
import { formatCurrency, formatHoldDays } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Sold Archive | TenTenLoupe",
}

export const dynamic = "force-dynamic"

function soldDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function venueName(venue: string, other: string | null): string {
  return venue === "other" ? other || "Other" : saleVenueLabels[venue] ?? venue
}

const TH = "px-3 py-2.5 font-mono text-2xs font-normal uppercase tracking-[0.12em] text-muted-foreground"
const TD_NUM = "px-3 py-2.5 text-right font-mono text-xs tabular-nums text-foreground"

/**
 * The sold archive (§3.7): one row per sale, newest first, with every money
 * column totalled in the footer. This is the screen you export when someone
 * asks what you have sold. Every figure comes from queries/sales.ts.
 */
export default async function SoldArchivePage() {
  const { rows, totals } = await getSoldArchive()

  return (
    <div className="space-y-5 pb-8">
      <div>
        <h1 className="font-display text-lg font-semibold tracking-tight">Sold Archive</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Every watch you have sold, net of venue and processing fees, shipping and
          insurance, against its cost basis at acquisition.
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-5 py-8 text-sm text-muted-foreground">
          No sales recorded yet. When a listed watch sells, record it from the watch
          page&rsquo;s Market panel and it will appear here.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[900px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border">
                <th className={TH} scope="col">
                  <span className="sr-only">Photo</span>
                </th>
                <th className={TH} scope="col">
                  Watch
                </th>
                <th className={TH} scope="col">
                  Sold
                </th>
                <th className={`${TH} text-right`} scope="col">
                  Held
                </th>
                <th className={TH} scope="col">
                  Venue
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
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.saleId}
                  className="border-b border-border/60 last:border-b-0 hover:bg-accent/40"
                >
                  <td className="py-2 pl-3">
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
                  </td>
                  <td className="max-w-[280px] px-3 py-2.5">
                    <Link
                      href={`/watch/${r.watchId}`}
                      className="block truncate text-sm text-foreground underline-offset-2 hover:underline"
                    >
                      {r.name}
                    </Link>
                    {r.nickname && (
                      <span className="block truncate text-xs text-muted-foreground">
                        {r.nickname}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">
                    {soldDate(r.soldAt)}
                  </td>
                  <td
                    className="px-3 py-2.5 text-right font-mono text-xs text-muted-foreground"
                    title={r.heldDays != null ? `${r.heldDays} days` : undefined}
                  >
                    {formatHoldDays(r.heldDays)}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">
                    {venueName(r.venue, r.venueOther)}
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
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border bg-muted/40">
                <td />
                <td className="px-3 py-2.5 text-xs text-muted-foreground">
                  {totals.salesCount} sale{totals.salesCount === 1 ? "" : "s"}
                </td>
                <td />
                <td />
                <td />
                <td />
                <td className={TD_NUM}>{formatCurrency(totals.salePriceCents)}</td>
                <td className="px-3 py-2.5 text-right font-mono text-xs tabular-nums text-muted-foreground">
                  {formatCurrency(totals.feesCents)}
                </td>
                <td className={TD_NUM}>{formatCurrency(totals.netProceedsCents)}</td>
                <td className="px-3 py-2.5 text-right">
                  <GainValue gain={totals.gain} showPct className="text-xs" />
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}

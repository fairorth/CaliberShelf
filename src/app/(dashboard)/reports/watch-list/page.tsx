import type { Metadata } from "next"
import Link from "next/link"
import { getWatchListReport } from "@/lib/queries/watch-list"
import type { WatchListRow } from "@/lib/queries/watch-list"
import { formatCurrency, cn } from "@/lib/utils"
import { WatchListExport } from "./_components/watch-list-export"

export const metadata: Metadata = {
  title: "Watch List | TenTenLoupe",
}

export const dynamic = "force-dynamic"

// ── CSV assembly (server-side; dollars with cents, RFC-ish quoting) ──

function csvCell(v: string | number | null): string {
  if (v == null) return ""
  const s = typeof v === "number" ? (v / 100).toFixed(2) : v
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function csv(rows: Array<Array<string | number | null>>): string {
  return rows.map((r) => r.map(csvCell).join(",")).join("\n")
}

function watchListCsv(rows: WatchListRow[]): string {
  return csv([
    [
      "brand",
      "model",
      "nickname",
      "reference",
      "status",
      "purchase_date",
      "purchase_price",
      "current_value",
      "valued_on",
    ],
    ...rows.map((r) => [
      r.brand,
      r.model,
      r.nickname,
      r.reference,
      r.status,
      r.purchaseDate,
      r.purchasePriceCents,
      r.currentValueCents,
      r.valuedOn,
    ]),
  ])
}

const fmtDate = (iso: string | null) =>
  iso
    ? new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—"

const money = (cents: number | null) =>
  cents != null ? formatCurrency(cents, "USD", true) : "—"

/**
 * The full schedule: every watch with its identifying basics, cost and latest
 * agent valuation. Built to leave the app — CSV (Excel-ready) and the print
 * dialog for PDF; the print output is the records/insurance schedule.
 */
export default async function WatchListReportPage() {
  const report = await getWatchListReport()
  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="space-y-5 pb-8 print:space-y-3 print:pb-0">
      <Link
        href="/reports"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground print:hidden"
      >
        ‹ Reports
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-lg font-semibold tracking-tight">
            Watch List
          </h1>
          <p className="text-sm text-muted-foreground">
            {report.totals.watchCount} watches ·{" "}
            {fmtDate(today)} ·{" "}
            <span className="font-mono tabular-nums">
              {money(report.totals.purchaseCents)}
            </span>{" "}
            paid /{" "}
            <span className="font-mono tabular-nums">
              {money(report.totals.currentValueCents)}
            </span>{" "}
            current ({report.totals.valuedCount} of {report.totals.ownedCount}{" "}
            owned valued)
          </p>
        </div>
        <WatchListExport
          csv={watchListCsv(report.rows)}
          filename={`tentenloupe-watch-list-${today}.csv`}
        />
      </div>

      {report.rows.length === 0 ? (
        <p className="max-w-xl rounded-xl border border-dashed border-border px-5 py-8 text-sm text-muted-foreground">
          No watches yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border print:overflow-visible print:rounded-none print:border-0">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border text-left font-mono text-2xs uppercase tracking-[0.12em] text-muted-foreground">
                <th className="px-3 py-2.5 font-medium">Brand</th>
                <th className="px-3 py-2.5 font-medium">Model</th>
                <th className="px-3 py-2.5 font-medium">Nickname</th>
                <th className="px-3 py-2.5 font-medium">Reference</th>
                <th className="px-3 py-2.5 font-medium">Status</th>
                <th className="px-3 py-2.5 text-right font-medium">Purchased</th>
                <th className="px-3 py-2.5 text-right font-medium">Paid</th>
                <th className="px-3 py-2.5 text-right font-medium">Current</th>
                <th className="px-3 py-2.5 text-right font-medium">Valued</th>
              </tr>
            </thead>
            <tbody>
              {report.rows.map((r, i) => (
                <tr
                  key={r.id}
                  className={cn(
                    "border-b border-border/50 last:border-0",
                    i % 2 === 1 && "bg-muted/30 print:bg-transparent",
                    r.isSold && "text-muted-foreground"
                  )}
                >
                  <td className="px-3 py-2 font-medium">{r.brand}</td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/watch/${r.id}`}
                      className="hover:text-primary print:text-foreground"
                    >
                      {r.model}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {r.nickname ?? "—"}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {r.reference ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {r.status}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-xs tabular-nums">
                    {fmtDate(r.purchaseDate)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums">
                    {money(r.purchasePriceCents)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums">
                    {money(r.currentValueCents)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-xs tabular-nums text-muted-foreground">
                    {r.valuedOn ? fmtDate(r.valuedOn) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border font-mono tabular-nums">
                <td className="px-3 py-2.5 text-2xs uppercase tracking-[0.12em] text-muted-foreground" colSpan={6}>
                  Totals · owned &amp; unsold ({report.totals.ownedCount})
                </td>
                <td className="px-3 py-2.5 text-right font-medium">
                  {money(report.totals.purchaseCents)}
                </td>
                <td className="px-3 py-2.5 text-right font-medium">
                  {money(report.totals.currentValueCents)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <p className="max-w-2xl text-xs text-muted-foreground print:text-2xs">
        Current value is the latest agent-researched estimate (mid); watches
        without one show “—”. Wish-list prices are purchase estimates and sold
        watches are realized history — both appear in the list but stay out of
        the totals. CSV opens directly in Excel.
      </p>
    </div>
  )
}

"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import type { WatchListRow, WatchListReport } from "@/lib/queries/watch-list"
import { ATTACHMENT_LEVELS, attachmentLabels } from "@/lib/validations/watch"
import { formatCurrency, cn } from "@/lib/utils"
import { WatchListExport } from "./watch-list-export"

// ── CSV assembly (dollars with cents, RFC-ish quoting) ──────────
// Exports exactly the rows on screen, in the on-screen order.

function csvCell(v: string | number | null): string {
  if (v == null) return ""
  const s = typeof v === "number" ? (v / 100).toFixed(2) : v
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function watchListCsv(rows: WatchListRow[]): string {
  return [
    [
      "brand",
      "model",
      "nickname",
      "reference",
      "status",
      "attachment",
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
      r.attachment ? attachmentLabels[r.attachment] : null,
      r.purchaseDate,
      r.purchasePriceCents,
      r.currentValueCents,
      r.valuedOn,
    ]),
  ]
    .map((r) => r.map(csvCell).join(","))
    .join("\n")
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

// ── Sorting ─────────────────────────────────────────────────────

type SortKey =
  | "brand"
  | "model"
  | "nickname"
  | "reference"
  | "status"
  | "attachment"
  | "purchaseDate"
  | "paid"
  | "current"
  | "valuedOn"

/** Comparable value per key; null = sorts last in either direction. */
function sortValue(r: WatchListRow, key: SortKey): string | number | null {
  switch (key) {
    case "brand":
      return `${r.brand} ${r.model}`.toLowerCase()
    case "model":
      return r.model.toLowerCase()
    case "nickname":
      return r.nickname?.toLowerCase() ?? null
    case "reference":
      return r.reference?.toLowerCase() ?? null
    case "status":
      return r.status
    // Rank, not label: sorting the words puts High above Max. Ascending is
    // strongest-first, which is how the scale reads.
    case "attachment":
      return r.attachment ? ATTACHMENT_LEVELS.indexOf(r.attachment) : null
    case "purchaseDate":
      return r.purchaseDate
    case "paid":
      return r.purchasePriceCents
    case "current":
      return r.currentValueCents
    case "valuedOn":
      return r.valuedOn
  }
}

const HEADERS: Array<{ key: SortKey; label: string; align?: "right" }> = [
  { key: "brand", label: "Brand" },
  { key: "model", label: "Model" },
  { key: "nickname", label: "Nickname" },
  { key: "reference", label: "Reference" },
  { key: "status", label: "Status" },
  { key: "attachment", label: "Attachment" },
  { key: "purchaseDate", label: "Purchased", align: "right" },
  { key: "paid", label: "Paid", align: "right" },
  { key: "current", label: "Current", align: "right" },
  { key: "valuedOn", label: "Valued", align: "right" },
]

/**
 * The interactive schedule: click a header to sort (click again to flip),
 * toggle wish-list rows. Defaults to wish list EXCLUDED — this report's main
 * job is the insurance/records schedule, and aspirational watches don't
 * belong on it. Export and print always reflect exactly the current view.
 */
export function WatchListTable({ report }: { report: WatchListReport }) {
  const [includeWishlist, setIncludeWishlist] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>("brand")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")

  const rows = useMemo(() => {
    const visible = report.rows.filter((r) => includeWishlist || !r.isWishlist)
    const dir = sortDir === "asc" ? 1 : -1
    return [...visible].sort((a, b) => {
      const av = sortValue(a, sortKey)
      const bv = sortValue(b, sortKey)
      if (av == null && bv == null) return 0
      if (av == null) return 1 // nulls last, both directions
      if (bv == null) return -1
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir
      return String(av).localeCompare(String(bv)) * dir
    })
  }, [report.rows, includeWishlist, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="space-y-4 print:space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {rows.length} watch{rows.length === 1 ? "" : "es"} shown ·{" "}
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
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm print:hidden">
            <input
              type="checkbox"
              checked={includeWishlist}
              onChange={(e) => setIncludeWishlist(e.target.checked)}
              className="h-4 w-4 rounded border-border accent-brass"
            />
            Include wish list
          </label>
          <WatchListExport
            csv={watchListCsv(rows)}
            filename={`tentenloupe-watch-list-${today}.csv`}
          />
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="max-w-xl rounded-xl border border-dashed border-border px-5 py-8 text-sm text-muted-foreground">
          Nothing to show with the current filter.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border print:overflow-visible print:rounded-none print:border-0">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border text-left font-mono text-2xs uppercase tracking-[0.12em] text-muted-foreground">
                {HEADERS.map((h) => (
                  <th
                    key={h.key}
                    className={cn("px-3 py-2.5 font-medium", h.align === "right" && "text-right")}
                  >
                    <button
                      type="button"
                      onClick={() => toggleSort(h.key)}
                      className={cn(
                        "inline-flex items-center gap-1 uppercase tracking-[0.12em] transition-colors hover:text-foreground",
                        sortKey === h.key && "text-foreground"
                      )}
                    >
                      {h.label}
                      {sortKey === h.key && (
                        <span aria-hidden className="print:hidden">
                          {sortDir === "asc" ? "▲" : "▼"}
                        </span>
                      )}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
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
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {r.attachment ? attachmentLabels[r.attachment] : "—"}
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
                <td
                  className="px-3 py-2.5 text-2xs uppercase tracking-[0.12em] text-muted-foreground"
                  colSpan={7}
                >
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
        watches are realized history — both stay out of the totals. CSV and
        print reflect exactly the rows shown above. CSV opens directly in
        Excel.
      </p>
    </div>
  )
}

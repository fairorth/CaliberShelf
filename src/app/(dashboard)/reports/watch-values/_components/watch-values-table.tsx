"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import type {
  WatchValueRow,
  WatchValuesReport,
} from "@/lib/queries/watch-values"
import {
  VALUATION_SOURCE_HINT,
  VALUATION_SOURCE_LABEL,
} from "@/lib/valuation"
import type { ValuationSource } from "@/lib/types/watch"
import { GainValue, GainPercent } from "@/components/gain-value"
import { StatusPill } from "@/components/ui/status-pill"
import { ReportExport } from "@/components/report-export"
import { formatCurrency, cn } from "@/lib/utils"

// ── CSV (dollars with cents, RFC-ish quoting) ───────────────────
// Exactly the rows on screen, in the on-screen order.

function csvCell(v: string | number | null): string {
  if (v == null) return ""
  const s = typeof v === "number" ? (v / 100).toFixed(2) : v
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function watchValuesCsv(rows: WatchValueRow[]): string {
  return [
    [
      "brand",
      "model",
      "nickname",
      "status",
      "source",
      "current_value",
      "valued_on",
      "cost_basis",
      "gain",
      "gain_pct",
      "change",
      "change_pct",
      "change_since",
      "valuations",
    ],
    ...rows.map((r) => [
      r.brand,
      r.model,
      r.nickname,
      r.status,
      r.source ? VALUATION_SOURCE_LABEL[r.source] : null,
      r.currentValueCents,
      r.valuedOn,
      r.costBasisCents,
      r.gain?.cents ?? null,
      r.gain?.pct != null ? r.gain.pct.toFixed(1) : null,
      r.change?.cents ?? null,
      r.change?.pct != null ? r.change.pct.toFixed(1) : null,
      r.change?.since.slice(0, 10) ?? null,
      String(r.valuationCount),
    ]),
  ]
    .map((r) => r.map(csvCell).join(","))
    .join("\n")
}

const fmtDate = (iso: string | null) =>
  iso
    ? new Date(iso.slice(0, 10) + "T00:00:00").toLocaleDateString("en-US", {
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
  | "status"
  | "source"
  | "value"
  | "basis"
  | "gain"
  | "gainPct"
  | "change"
  | "valuedOn"

/** Source rank, so sorting groups researched → logged → static rather than
 *  alphabetising three words into a meaningless order. */
const SOURCE_RANK: Record<ValuationSource, number> = { agent: 0, manual: 1, tier: 2 }

/** Comparable value per key; null sorts last in either direction. */
function sortValue(r: WatchValueRow, key: SortKey): string | number | null {
  switch (key) {
    case "brand":
      return `${r.brand} ${r.model}`.toLowerCase()
    case "model":
      return r.model.toLowerCase()
    case "status":
      return r.status
    case "source":
      return r.source ? SOURCE_RANK[r.source] : null
    case "value":
      return r.currentValueCents
    case "basis":
      return r.costBasisCents
    case "gain":
      return r.gain?.cents ?? null
    case "gainPct":
      return r.gain?.pct ?? null
    case "change":
      return r.change?.cents ?? null
    case "valuedOn":
      return r.valuedOn
  }
}

const HEADERS: Array<{ key: SortKey; label: string; align?: "right" }> = [
  { key: "brand", label: "Brand" },
  { key: "model", label: "Model" },
  { key: "status", label: "Status" },
  { key: "source", label: "Source" },
  { key: "value", label: "Value", align: "right" },
  { key: "basis", label: "Basis", align: "right" },
  { key: "gain", label: "Gain", align: "right" },
  { key: "gainPct", label: "Gain %", align: "right" },
  { key: "change", label: "Change", align: "right" },
  { key: "valuedOn", label: "Valued", align: "right" },
]

const SOURCE_FILTERS: Array<{ value: "" | ValuationSource; label: string }> = [
  { value: "", label: "All sources" },
  { value: "agent", label: "Researched" },
  { value: "manual", label: "Logged" },
  { value: "tier", label: "Static" },
]

/**
 * The examination table. Sorted by value descending on arrival — the money is
 * the point — and filterable by source, which is the question this report
 * exists to answer: how much of the total is research and how much is
 * arithmetic.
 */
export function WatchValuesTable({ report }: { report: WatchValuesReport }) {
  const [source, setSource] = useState<"" | ValuationSource>("")
  const [sortKey, setSortKey] = useState<SortKey>("value")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  const rows = useMemo(() => {
    const visible = report.rows.filter((r) => !source || r.source === source)
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
  }, [report.rows, source, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      // Money and dates read most-first; names read A–Z.
      setSortDir(key === "brand" || key === "model" || key === "status" ? "asc" : "desc")
    }
  }

  const today = new Date().toISOString().slice(0, 10)
  const shownValue = rows.reduce((sum, r) => sum + (r.currentValueCents ?? 0), 0)

  return (
    <div className="space-y-4 print:space-y-3">
      {/* Where the total comes from. One card per source that has rows — the
          headline number of the whole app, finally shown as its parts. */}
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {report.bySource.map((s) => (
          <button
            key={s.source}
            type="button"
            onClick={() => setSource(source === s.source ? "" : s.source)}
            className={cn(
              "rounded-xl border px-4 py-3 text-left transition-colors",
              source === s.source
                ? "border-brass/45 bg-muted/40"
                : "border-border hover:border-brass/30"
            )}
            title={VALUATION_SOURCE_HINT[s.source]}
          >
            <p className="font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground">
              {VALUATION_SOURCE_LABEL[s.source]}
            </p>
            <p className="mt-1 font-mono text-sm tabular-nums text-foreground">
              {money(s.valueCents)}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {s.count} watch{s.count === 1 ? "" : "es"} ·{" "}
              <GainValue gain={s.gain} showPct wholeDollars className="text-xs" />
            </p>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {rows.length} watch{rows.length === 1 ? "" : "es"} shown ·{" "}
          <span className="font-mono tabular-nums">{money(shownValue)}</span>
          {report.totals.movedCount > 0 && (
            <> · {report.totals.movedCount} moved since their last valuation</>
          )}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm print:hidden">
            <span className="text-muted-foreground">Source</span>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value as "" | ValuationSource)}
              className="h-9 rounded-md border border-input bg-background px-2 text-sm accent-brass outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/50"
            >
              {SOURCE_FILTERS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <ReportExport
            csv={watchValuesCsv(rows)}
            filename={`tentenloupe-watch-values-${today}.csv`}
          />
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="max-w-xl rounded-xl border border-dashed border-border px-5 py-8 text-sm text-muted-foreground">
          No watches carry a value from that source.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border print:overflow-visible print:rounded-none print:border-0">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border text-left font-mono text-2xs uppercase tracking-[0.12em] text-muted-foreground">
                {HEADERS.map((h) => (
                  <th
                    key={h.key}
                    className={cn(
                      "px-3 py-2.5 font-medium",
                      h.align === "right" && "text-right"
                    )}
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
                    i % 2 === 1 && "bg-muted/30 print:bg-transparent"
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
                    {r.nickname && (
                      <span className="ml-1.5 text-xs text-muted-foreground">
                        {r.nickname}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {r.status}
                  </td>
                  <td className="px-3 py-2">
                    {r.source ? (
                      <StatusPill tone="neutral" title={VALUATION_SOURCE_HINT[r.source]}>
                        {VALUATION_SOURCE_LABEL[r.source]}
                      </StatusPill>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums">
                    {money(r.currentValueCents)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums text-muted-foreground">
                    {money(r.costBasisCents || null)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <GainValue gain={r.gain} wholeDollars />
                  </td>
                  <td className="px-3 py-2 text-right">
                    {r.gain?.pct != null ? (
                      <GainPercent
                        gain={r.gain}
                        className={
                          r.gain.cents >= 0 ? "text-chart-2" : "text-destructive"
                        }
                      />
                    ) : (
                      <span className="font-mono tabular-nums text-muted-foreground">—</span>
                    )}
                  </td>
                  <td
                    className="px-3 py-2 text-right"
                    title={
                      r.change ? `since ${fmtDate(r.change.since)}` : undefined
                    }
                  >
                    {r.change ? (
                      <GainValue
                        gain={{ cents: r.change.cents, pct: r.change.pct }}
                        showPct
                        wholeDollars
                        className="text-xs"
                      />
                    ) : (
                      <span
                        className="font-mono text-xs tabular-nums text-muted-foreground"
                        title="Only one valuation so far — nothing to compare against."
                      >
                        —
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-xs tabular-nums text-muted-foreground">
                    {fmtDate(r.valuedOn)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border font-mono tabular-nums">
                <td
                  className="px-3 py-2.5 text-2xs uppercase tracking-[0.12em] text-muted-foreground"
                  colSpan={4}
                >
                  Totals · {report.totals.valuedCount} of {report.totals.watchCount} valued
                </td>
                <td className="px-3 py-2.5 text-right font-medium">
                  {money(report.totals.valueCents)}
                </td>
                <td className="px-3 py-2.5 text-right text-muted-foreground">
                  {money(report.totals.basisCents)}
                </td>
                <td className="px-3 py-2.5 text-right">
                  <GainValue gain={report.totals.gain} wholeDollars />
                </td>
                <td className="px-3 py-2.5 text-right">
                  {report.totals.gain?.pct != null ? (
                    <GainPercent
                      gain={report.totals.gain}
                      className={
                        report.totals.gain.cents >= 0
                          ? "text-chart-2"
                          : "text-destructive"
                      }
                    />
                  ) : (
                    <span className="font-mono tabular-nums text-muted-foreground">—</span>
                  )}
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}

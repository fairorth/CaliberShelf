"use client"

import { useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { setPriceTracking } from "@/lib/actions/price-tracking"
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
      "research",
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
      r.researching ? "on" : "off",
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
  | "research"

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
    // Descending groups the actionable rows: researching first, then the ones
    // that could be, then the ones that need a reference number before they can.
    case "research":
      return r.researching ? 2 : r.reference ? 1 : 0
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
  { key: "research", label: "Research" },
]

/**
 * One row's research switch.
 *
 * This is the report's one WRITE, and it deliberately is not the Source pill:
 * Source says what produced the number you are looking at, Research says
 * whether the agent will keep it fresh. A watch can be Static and researching
 * (first run pending) or Researched and no longer tracked, so folding them into
 * one control would make two facts share a word.
 *
 * Applying is immediate — switching research on spends nothing, it only enrols
 * the watch in the monthly run — so there is no staged "apply" step to get
 * wrong. A watch with no reference number cannot be enrolled at all (Zod
 * refine, DB CHECK, and the action all refuse), so it offers the fix instead of
 * failing on click.
 */
function ResearchToggle({
  row,
  onDone,
}: {
  row: WatchValueRow
  onDone: () => void
}) {
  const [pending, startTransition] = useTransition()
  const [on, setOn] = useState(row.researching)

  if (!row.reference) {
    return (
      <Link
        href={`/watch/${row.id}/edit`}
        title="Research needs a reference number — a valuation has to be about a specific watch. Add one here."
        className="font-mono text-2xs uppercase tracking-[0.1em] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline print:no-underline"
      >
        Needs ref
      </Link>
    )
  }

  function toggle(next: boolean) {
    setOn(next) // optimistic: the click has to feel like the switch it looks like
    startTransition(async () => {
      const result = await setPriceTracking(row.id, next)
      if (result.error) {
        setOn(!next)
        toast.error(result.error)
        return
      }
      toast.success(
        next
          ? `Researching ${row.brand} ${row.model} — first estimate on the next run.`
          : `Stopped researching ${row.brand} ${row.model}.`
      )
      onDone()
    })
  }

  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-2 print:cursor-auto",
        pending && "opacity-60"
      )}
      title={
        on
          ? "The valuation agent researches this watch on the monthly run"
          : "Enrol this watch in the monthly valuation run"
      }
    >
      <input
        type="checkbox"
        checked={on}
        disabled={pending}
        onChange={(e) => toggle(e.target.checked)}
        className="h-4 w-4 rounded border-border accent-brass"
        aria-label={`Research ${row.brand} ${row.model}`}
      />
      <span className="text-xs text-muted-foreground">{on ? "On" : "Off"}</span>
    </label>
  )
}

/**
 * The examination table. Sorted by value descending on arrival — the money is
 * the point — and filterable by source, which is the question this report
 * exists to answer: how much of the total is research and how much is
 * arithmetic.
 */
export function WatchValuesTable({ report }: { report: WatchValuesReport }) {
  const router = useRouter()
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

  return (
    <div className="space-y-4 print:space-y-3">
      {/* The total, then what it is made of. The cards are also the filter:
          Total is the "all sources" option, so there is one control for one
          piece of state rather than a card row and a select saying the same
          thing. */}
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <button
          type="button"
          onClick={() => setSource("")}
          className={cn(
            "rounded-xl border px-4 py-3 text-left transition-colors",
            source === ""
              ? "border-brass/45 bg-muted/40"
              : "border-border hover:border-brass/30"
          )}
          title="Every watch you hold, whatever produced its value"
        >
          <p className="font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground">
            Total
          </p>
          <p className="mt-1 font-mono text-sm tabular-nums text-foreground">
            {money(report.totals.valueCents)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {report.totals.valuedCount} of {report.totals.watchCount} valued ·{" "}
            <GainValue
              gain={report.totals.gain}
              showPct
              wholeDollars
              className="text-xs"
            />
            {report.totals.movedCount > 0 && (
              <> · {report.totals.movedCount} moved</>
            )}
          </p>
        </button>
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

      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <p className="max-w-xl text-xs text-muted-foreground">
          Research enrols a watch in the monthly valuation run (about $1–1.50 each).
          It keeps its static estimate until the first researched value lands.
        </p>
        <ReportExport
          csv={watchValuesCsv(rows)}
          filename={`tentenloupe-watch-values-${today}.csv`}
        />
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
                  <td className="px-3 py-2">
                    <ResearchToggle row={r} onDone={() => router.refresh()} />
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
                <td colSpan={3} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}

import type { ColumnId } from "@/components/collection-table"
import { COLUMN_LABELS } from "@/components/collection-table"
import type { WatchWithCover } from "@/lib/types/watch"
import type { SaleSummary } from "@/lib/queries/sales"
import { gainVersusBasis } from "@/lib/queries/gain"
import { caliberLabel } from "@/lib/caliber"
import { caliberTypeLabels } from "@/lib/validations/movement"

// ── Collection → CSV (what you see is what exports) ─────────────
//
// Mirrors the on-screen table: the caller passes the columns currently
// visible and the rows currently displayed (filtered + sorted), and each
// cell exports what the table shows — including a sold row's net proceeds
// in the Price column. Money is dollars with cents; dates are ISO.

function cell(v: string | number | null): string {
  if (v == null) return ""
  const s = String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

const dollars = (cents: number | null | undefined) =>
  cents != null ? (cents / 100).toFixed(2) : null

function columnValue(
  id: ColumnId,
  w: WatchWithCover,
  valuationMids?: Record<string, number>,
  saleSummaries?: Record<string, SaleSummary>
): string | number | null {
  const sold = w.sale_status === "sold"
  switch (id) {
    case "photo":
      return null // never exported
    case "category":
      return w.category?.name ?? null
    case "brand":
      return w.brand.name
    case "model":
      return w.model
    case "nickname":
      return w.nickname
    case "reference":
      return w.reference_number
    case "movementType": {
      const ct = w.movement?.caliber_type
      return ct ? (caliberTypeLabels[ct] ?? ct) : null
    }
    case "caliber":
      return w.movement ? caliberLabel(w.movement) : null
    case "box":
      return w.box ?? null
    case "worn":
      return w.wear_count ?? 0
    case "purchased":
      return w.purchase_date
    case "price":
      // Matches the table: a sold row shows what it returned (§3.6).
      return sold && saleSummaries?.[w.id]
        ? dollars(saleSummaries[w.id].netProceedsCents)
        : dollars(w.purchase_price_cents)
    case "value":
      return !sold ? dollars(valuationMids?.[w.id] ?? null) : null
    case "gain": {
      if (sold || valuationMids?.[w.id] == null) return null
      const gain = gainVersusBasis(valuationMids[w.id], w)
      return gain ? dollars(gain.cents) : null
    }
  }
}

export function collectionCsv(
  watches: WatchWithCover[],
  columns: ColumnId[],
  valuationMids?: Record<string, number>,
  saleSummaries?: Record<string, SaleSummary>
): string {
  const cols = columns.filter((id) => id !== "photo")
  const header = cols.map((id) => cell(COLUMN_LABELS[id]))
  const body = watches.map((w) =>
    cols.map((id) => cell(columnValue(id, w, valuationMids, saleSummaries)))
  )
  return [header, ...body].map((r) => r.join(",")).join("\n")
}

/** Client-side download with a UTF-8 BOM so Excel opens it directly. */
export function downloadCsv(csv: string, filename: string) {
  const bom = String.fromCharCode(0xfeff)
  const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

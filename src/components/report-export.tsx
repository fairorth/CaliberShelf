"use client"

import { Download, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"

/**
 * Export controls for a report table (Watch List, Watch Values). The CSV string
 * is assembled by the caller from exactly the rows on screen and handed down;
 * downloading prefixes a UTF-8 BOM so Excel opens it with correct encoding
 * (double-click, no import wizard). "Print / PDF" uses the browser's print
 * dialog — the dashboard layout is already print-clean, so Save-as-PDF produces
 * the schedule directly. Hidden in print.
 */
export function ReportExport({ csv, filename }: { csv: string; filename: string }) {
  function downloadCsv() {
    const bom = String.fromCharCode(0xfeff)
    const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex gap-2 print:hidden">
      <Button variant="outline" size="sm" className="gap-1.5" onClick={downloadCsv}>
        <Download className="size-3.5" aria-hidden />
        CSV / Excel
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => window.print()}
      >
        <Printer className="size-3.5" aria-hidden />
        Print / PDF
      </Button>
    </div>
  )
}

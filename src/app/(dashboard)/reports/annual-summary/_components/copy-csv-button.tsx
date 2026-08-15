"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"

/**
 * "Copy as CSV" per Annual Summary section (§4.2) — what actually gets used
 * at tax time. The CSV string is assembled on the server and handed down;
 * this button only writes it to the clipboard. Hidden in print.
 */
export function CopyCsvButton({ csv, label }: { csv: string; label: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(csv)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      // Clipboard denied (permissions) — nothing sensible to do inline.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copy ${label} as CSV`}
      className="inline-flex items-center gap-1.5 font-mono text-2xs uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-foreground print:hidden"
    >
      {copied ? (
        <Check className="size-3" aria-hidden />
      ) : (
        <Copy className="size-3" aria-hidden />
      )}
      {copied ? "Copied" : "CSV"}
    </button>
  )
}

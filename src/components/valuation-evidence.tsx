import { formatCurrency } from "@/lib/utils"
import type { WatchValuation } from "@/lib/types/watch"

interface ValuationEvidenceProps {
  valuation: WatchValuation
}

const CONFIDENCE_STYLES: Record<WatchValuation["confidence"], string> = {
  high: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  medium: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  low: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
}

export function ConfidenceBadge({
  confidence,
}: {
  confidence: WatchValuation["confidence"]
}) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${CONFIDENCE_STYLES[confidence]}`}
    >
      {confidence} confidence
    </span>
  )
}

/**
 * The audit trail behind a valuation: variant assumption, method, caveats,
 * every observed price with its source, and the source URLs. Server-safe
 * (no interactivity) — wrap in a disclosure element for expand/collapse.
 */
export function ValuationEvidence({ valuation: v }: ValuationEvidenceProps) {
  return (
    <div className="space-y-4 text-sm">
      {v.assumed_variant && (
        <p>
          <span className="font-medium text-muted-foreground">Variant assumed: </span>
          {v.assumed_variant}
        </p>
      )}

      {v.method_notes && (
        <p>
          <span className="font-medium text-muted-foreground">Method: </span>
          {v.method_notes}
        </p>
      )}

      {v.caveats && (
        <p>
          <span className="font-medium text-muted-foreground">Caveats: </span>
          {v.caveats}
        </p>
      )}

      {v.datapoints && v.datapoints.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <th className="py-1.5 pr-3 font-medium">Price</th>
                <th className="py-1.5 pr-3 font-medium">Type</th>
                <th className="py-1.5 pr-3 font-medium">Source</th>
                <th className="py-1.5 pr-3 font-medium">Date</th>
                <th className="py-1.5 font-medium">Note</th>
              </tr>
            </thead>
            <tbody>
              {v.datapoints.map((dp, i) => (
                <tr key={i} className="border-b border-border/50 align-top">
                  <td className="py-1.5 pr-3 font-mono whitespace-nowrap text-brass">
                    {formatCurrency(Math.round(dp.price_usd * 100), "USD", true)}
                  </td>
                  <td className="py-1.5 pr-3">
                    <span
                      className={
                        dp.type === "sold"
                          ? "rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400"
                          : "rounded-full bg-sky-500/15 px-2 py-0.5 text-[11px] font-medium text-sky-600 dark:text-sky-400"
                      }
                    >
                      {dp.type}
                    </span>
                  </td>
                  <td className="py-1.5 pr-3">{dp.source}</td>
                  <td className="py-1.5 pr-3 whitespace-nowrap">{dp.date}</td>
                  <td className="py-1.5 text-muted-foreground">{dp.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {v.sources && v.sources.length > 0 && (
        <div>
          <p className="mb-1 font-medium text-muted-foreground">Sources</p>
          <ul className="space-y-0.5">
            {v.sources.map((url, i) => (
              <li key={i} className="truncate">
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline-offset-2 hover:underline"
                >
                  {url}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {v.agent_model && (
        <p className="text-xs text-muted-foreground">
          Researched by {v.agent_model}
          {v.n_datapoints != null ? ` · ${v.n_datapoints} datapoints` : ""}
        </p>
      )}
    </div>
  )
}

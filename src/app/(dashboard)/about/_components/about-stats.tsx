"use client"

interface AboutStatsProps {
  watchesTracked: number
  /** Pre-formatted collection value, or null when there's nothing to show. */
  collectionValue: string | null
  catalogModels: number
  agentCount: number
}

/**
 * "By the numbers" stat tiles. The Collection Value tile used to be gated on
 * the per-device cost preference, which is why this is a Client Component;
 * since v1.10.5 that preference does one thing only — the Collection's own
 * summary line — so the tile simply shows whenever there is a value.
 */
export function AboutStats({
  watchesTracked,
  collectionValue,
  catalogModels,
  agentCount,
}: AboutStatsProps) {
  const stats: { label: string; value: string }[] = [
    { label: "Watches tracked", value: watchesTracked.toLocaleString() },
  ]
  if (collectionValue) {
    stats.push({ label: "Collection value", value: collectionValue })
  }
  if (catalogModels > 0) {
    stats.push({ label: "Catalog models", value: catalogModels.toLocaleString() })
  }
  stats.push({ label: "Automation agents", value: String(agentCount) })

  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-xl border border-border bg-card px-4 py-5 text-center"
        >
          <div className="font-display text-lg font-semibold tabular-nums text-foreground">
            {s.value}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">{s.label}</div>
        </div>
      ))}
    </section>
  )
}

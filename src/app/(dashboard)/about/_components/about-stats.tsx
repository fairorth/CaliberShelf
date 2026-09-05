"use client"

interface AboutStatsProps {
  watchesTracked: number
  /** Pre-formatted collection value, or null when there's nothing to show. */
  collectionValue: string | null
  agentCount: number
}

/**
 * "By the numbers" stat tiles — three facts about YOUR collection.
 *
 * "Catalog models" (the ChronoScout mirror's row count, ~9,000) was a fourth
 * and is gone in v1.10.6: it measured someone else's database, sat beside two
 * numbers about the owner's own watches, and moved when a weekly sync ran. A
 * stat tile has to be about you or it is decoration.
 */
export function AboutStats({
  watchesTracked,
  collectionValue,
  agentCount,
}: AboutStatsProps) {
  const stats: { label: string; value: string }[] = [
    { label: "Watches tracked", value: watchesTracked.toLocaleString() },
  ]
  if (collectionValue) {
    stats.push({ label: "Collection value", value: collectionValue })
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

"use client"

import { useEffect, useState } from "react"
import { SHOW_COST_KEY } from "@/lib/preferences"

interface AboutStatsProps {
  watchesTracked: number
  /** Pre-formatted collection value, or null when there's nothing to show. */
  collectionValue: string | null
  catalogModels: number
  agentCount: number
}

/**
 * "By the numbers" stat tiles. Client-side because the Collection Value tile is
 * gated on the per-device "Include Cost in Category Listing" preference
 * (localStorage, same key the Collection views use). Defaults to hidden until
 * the preference is read, so a cost-suppressed device never flashes the value.
 */
export function AboutStats({
  watchesTracked,
  collectionValue,
  catalogModels,
  agentCount,
}: AboutStatsProps) {
  const [showCost, setShowCost] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing to a client-only preference
    setShowCost(localStorage.getItem(SHOW_COST_KEY) === "1")
  }, [])

  const stats: { label: string; value: string }[] = [
    { label: "Watches tracked", value: watchesTracked.toLocaleString() },
  ]
  if (collectionValue && showCost) {
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
          className="rounded-2xl border border-border bg-card px-4 py-5 text-center"
        >
          <div className="font-display text-2xl font-semibold tabular-nums text-foreground sm:text-3xl">
            {s.value}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">{s.label}</div>
        </div>
      ))}
    </section>
  )
}

export interface AboutStat {
  label: string
  value: string
  /** One quiet line under the label — what the number is made of. */
  detail?: string
}

/**
 * "By the numbers" — facts about YOUR collection and how it is used, all live.
 *
 * "Catalog models" (the ChronoScout mirror's row count, ~9,000) was a tile and
 * is gone since v1.10.6: it measured someone else's database. A stat tile has
 * to be about you or it is decoration. The page drops a tile whose number is
 * zero rather than advertise an unused feature with a 0.
 */
export function AboutStats({ stats }: { stats: AboutStat[] }) {
  return (
    <section aria-label="By the numbers" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {stats.map((s) => (
        <div key={s.label} className="rounded-xl border border-border bg-card px-3 py-5 text-center">
          <div className="font-display text-lg font-semibold tabular-nums text-foreground">{s.value}</div>
          <div className="mt-1 text-xs text-muted-foreground">{s.label}</div>
          {s.detail && <div className="mt-0.5 text-2xs text-muted-foreground">{s.detail}</div>}
        </div>
      ))}
    </section>
  )
}

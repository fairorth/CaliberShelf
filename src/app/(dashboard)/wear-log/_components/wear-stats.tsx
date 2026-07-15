"use client"

import Image from "next/image"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import type { WearStats } from "@/lib/types/watch"

interface WearStatsViewProps {
  stats: WearStats
}

export function WearStatsView({ stats }: WearStatsViewProps) {
  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="This Month" value={stats.totalThisMonth} />
        <StatCard label="This Year" value={stats.totalThisYear} />
        <StatCard label="All Time" value={stats.totalAllTime} />
        <StatCard
          label="Current Streak"
          value={stats.currentStreak}
          suffix={stats.currentStreak === 1 ? " day" : " days"}
        />
      </div>

      {/* Longest streak (if notable) */}
      {stats.longestStreak > 1 && (
        <p className="text-sm text-muted-foreground">
          Longest wear streak: <span className="font-semibold text-foreground">{stats.longestStreak} days</span>
        </p>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Most Worn */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Most Worn</h3>
          {stats.mostWorn.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data yet</p>
          ) : (
            <div className="space-y-2">
              {stats.mostWorn.map((item, i) => (
                <WatchRankRow
                  key={item.watch.id}
                  rank={i + 1}
                  watch={item.watch}
                  count={item.count}
                />
              ))}
            </div>
          )}
        </div>

        {/* Least Worn */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Least Worn</h3>
          {stats.leastWorn.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data yet</p>
          ) : (
            <div className="space-y-2">
              {stats.leastWorn.map((item, i) => (
                <WatchRankRow
                  key={item.watch.id}
                  rank={i + 1}
                  watch={item.watch}
                  count={item.count}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Never Worn */}
      {stats.neverWorn.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">
            Never Worn{" "}
            <span className="text-sm font-normal text-muted-foreground">
              ({stats.neverWorn.length})
            </span>
          </h3>
          <div className="flex flex-wrap gap-2">
            {stats.neverWorn.map((w) => (
              <Link
                key={w.id}
                href={`/watch/${w.id}/edit`}
                className="group flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm transition-colors hover:bg-accent"
              >
                <div className="relative h-6 w-6 overflow-hidden rounded-full border border-border">
                  {w.cover_photo_url ? (
                    <Image
                      src={w.cover_photo_url}
                      alt={w.model}
                      fill
                      className="object-cover"
                      sizes="24px"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center bg-muted text-[8px] font-bold text-muted-foreground">
                      {w.brand.name.charAt(0)}
                    </span>
                  )}
                </div>
                <span className="text-muted-foreground group-hover:text-foreground">
                  {w.brand.name} {w.model}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  suffix = "",
}: {
  label: string
  value: number
  suffix?: string
}) {
  return (
    <Card className="p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold tracking-tight">
        {value}
        {suffix && <span className="text-sm font-normal text-muted-foreground">{suffix}</span>}
      </p>
    </Card>
  )
}

function WatchRankRow({
  rank,
  watch,
  count,
}: {
  rank: number
  watch: { id: string; model: string; cover_photo_url: string | null; brand: { name: string } }
  count: number
}) {
  return (
    <Link
      href={`/watch/${watch.id}/edit`}
      className="flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-accent"
    >
      <span className="w-5 text-center text-sm font-bold text-muted-foreground">
        {rank}
      </span>
      <div className="relative h-9 w-9 flex-shrink-0 overflow-hidden rounded-full border border-border">
        {watch.cover_photo_url ? (
          <Image
            src={watch.cover_photo_url}
            alt={watch.model}
            fill
            className="object-cover"
            sizes="36px"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-muted text-xs font-bold text-muted-foreground">
            {watch.brand.name.charAt(0)}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {watch.brand.name} {watch.model}
        </p>
      </div>
      <span className="text-sm font-semibold tabular-nums">
        {count} {count === 1 ? "wear" : "wears"}
      </span>
    </Link>
  )
}

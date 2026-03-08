"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"
import type { WearLogWithWatch } from "@/lib/types/watch"

interface CalendarDayCellProps {
  day: number
  isToday: boolean
  isCurrentMonth: boolean
  logs: WearLogWithWatch[]
  onClick: () => void
}

export function CalendarDayCell({
  day,
  isToday,
  isCurrentMonth,
  logs,
  onClick,
}: CalendarDayCellProps) {
  const maxVisible = 3
  const overflow = logs.length - maxVisible

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-[72px] flex-col gap-1 rounded-md border p-1.5 text-left transition-colors sm:min-h-[88px] sm:p-2",
        isCurrentMonth
          ? "border-border bg-card hover:bg-accent/50"
          : "border-transparent bg-transparent opacity-30",
        isToday && "border-primary ring-1 ring-primary/30",
      )}
    >
      <span
        className={cn(
          "text-xs font-medium",
          isToday
            ? "text-primary"
            : isCurrentMonth
              ? "text-foreground"
              : "text-muted-foreground",
        )}
      >
        {day}
      </span>

      {logs.length > 0 && (
        <div className="flex flex-wrap gap-0.5">
          {logs.slice(0, maxVisible).map((log) => (
            <div
              key={log.id}
              className="relative h-5 w-5 overflow-hidden rounded-full border border-border sm:h-6 sm:w-6"
              title={`${log.watch.brand.name} ${log.watch.model}`}
            >
              {log.watch.cover_photo_url ? (
                <Image
                  src={log.watch.cover_photo_url}
                  alt={log.watch.model}
                  fill
                  className="object-cover"
                  sizes="24px"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center bg-muted text-[8px] font-bold text-muted-foreground">
                  {log.watch.brand.name.charAt(0)}
                </span>
              )}
            </div>
          ))}
          {overflow > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[9px] font-medium text-muted-foreground sm:h-6 sm:w-6">
              +{overflow}
            </span>
          )}
        </div>
      )}
    </button>
  )
}

"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { fetchMonthLogs } from "@/lib/actions/wear-log-actions"
import { CalendarDayCell } from "./calendar-day-cell"
import { AddWearDialog } from "./add-wear-dialog"
import type { WearLogWithWatch, WatchWithCover } from "@/lib/types/watch"

interface WearCalendarProps {
  initialLogs: WearLogWithWatch[]
  initialYear: number
  initialMonth: number
  watches: WatchWithCover[]
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export function WearCalendar({
  initialLogs,
  initialYear,
  initialMonth,
  watches,
}: WearCalendarProps) {
  const [year, setYear] = useState(initialYear)
  const [month, setMonth] = useState(initialMonth)
  const [logs, setLogs] = useState(initialLogs)
  const [isPending, startTransition] = useTransition()
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  function navigate(direction: -1 | 1) {
    let newMonth = month + direction
    let newYear = year
    if (newMonth < 1) {
      newMonth = 12
      newYear--
    } else if (newMonth > 12) {
      newMonth = 1
      newYear++
    }
    setYear(newYear)
    setMonth(newMonth)
    startTransition(async () => {
      const result = await fetchMonthLogs(newYear, newMonth)
      setLogs(result)
    })
  }

  function refreshMonth() {
    startTransition(async () => {
      const result = await fetchMonthLogs(year, month)
      setLogs(result)
    })
  }

  // Build calendar grid
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay() // 0=Sun
  const daysInMonth = new Date(year, month, 0).getDate()

  // Previous month days to fill first row
  const prevMonthDays = new Date(year, month - 1, 0).getDate()
  const leadingDays = firstDayOfMonth

  // Next month days to fill last row
  const totalCells = Math.ceil((leadingDays + daysInMonth) / 7) * 7
  const trailingDays = totalCells - leadingDays - daysInMonth

  // Group logs by date string
  const logsByDate = new Map<string, WearLogWithWatch[]>()
  for (const log of logs) {
    const existing = logsByDate.get(log.worn_date) ?? []
    existing.push(log)
    logsByDate.set(log.worn_date, existing)
  }

  // Today
  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)

  // Build day cells
  const cells: Array<{
    day: number
    isCurrentMonth: boolean
    isToday: boolean
    dateStr: string
    logs: WearLogWithWatch[]
  }> = []

  // Leading (prev month)
  for (let i = leadingDays - 1; i >= 0; i--) {
    const d = prevMonthDays - i
    const prevM = month === 1 ? 12 : month - 1
    const prevY = month === 1 ? year - 1 : year
    const dateStr = `${prevY}-${String(prevM).padStart(2, "0")}-${String(d).padStart(2, "0")}`
    cells.push({
      day: d,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
      dateStr,
      logs: logsByDate.get(dateStr) ?? [],
    })
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`
    cells.push({
      day: d,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
      dateStr,
      logs: logsByDate.get(dateStr) ?? [],
    })
  }

  // Trailing (next month)
  for (let d = 1; d <= trailingDays; d++) {
    const nextM = month === 12 ? 1 : month + 1
    const nextY = month === 12 ? year + 1 : year
    const dateStr = `${nextY}-${String(nextM).padStart(2, "0")}-${String(d).padStart(2, "0")}`
    cells.push({
      day: d,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
      dateStr,
      logs: logsByDate.get(dateStr) ?? [],
    })
  }

  return (
    <div className="space-y-4">
      {/* Header: navigation + add button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
            disabled={isPending}
          >
            &larr;
          </Button>
          <h2 className="min-w-[160px] text-center text-lg font-semibold">
            {MONTH_NAMES[month - 1]} {year}
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(1)}
            disabled={isPending}
          >
            &rarr;
          </Button>
        </div>

        <AddWearDialog watches={watches} onSuccess={refreshMonth} />
      </div>

      {/* Calendar grid */}
      <div className={isPending ? "pointer-events-none opacity-50" : ""}>
        {/* Day headers */}
        <div className="mb-1 grid grid-cols-7 gap-1">
          {DAY_NAMES.map((day) => (
            <div
              key={day}
              className="py-1 text-center text-xs font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell) => (
            <CalendarDayCell
              key={cell.dateStr}
              day={cell.day}
              isToday={cell.isToday}
              isCurrentMonth={cell.isCurrentMonth}
              logs={cell.logs}
              onClick={() => setSelectedDate(cell.dateStr)}
            />
          ))}
        </div>
      </div>

      {/* Controlled dialog for day-cell click */}
      <AddWearDialog
        watches={watches}
        defaultDate={selectedDate ?? undefined}
        open={selectedDate !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedDate(null)
        }}
        onSuccess={refreshMonth}
      />
    </div>
  )
}

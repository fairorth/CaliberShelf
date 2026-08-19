"use client"

import { useSyncExternalStore } from "react"
import { cn } from "@/lib/utils"

/** One 1s interval per subscriber, cleared when the last one unmounts. */
function subscribe(onTick: () => void) {
  const id = setInterval(onTick, 1000)
  return () => clearInterval(id)
}

/**
 * Epoch SECONDS, not milliseconds: `getSnapshot` must return the same value
 * for the same state or React re-renders forever, and truncating to the second
 * is what makes it stable between ticks.
 */
function getSnapshot(): number {
  return Math.floor(Date.now() / 1000)
}

/** The server has no idea what time it is where the reader is, so it renders
 *  nothing and the first client pass fills it in. */
function getServerSnapshot(): null {
  return null
}

/**
 * The header clock (Phase 8 §6.2) — a timekeeping application whose home
 * screen did not tell the time.
 *
 * `TUE 18 AUG   10:10 :34 PM`. The date and the running seconds are 11px
 * muted; the hour and minute are 15px at full weight, the way a watch puts
 * running seconds on a subsidiary register. The tick is visible without
 * competing with the photograph — and it is the only motion on the page that
 * is information rather than decoration, which is precisely the kind of
 * movement a watch person reads as alive rather than busy.
 *
 * `useSyncExternalStore` rather than a `useState` + `useEffect` pair: it is
 * the primitive built for exactly this shape, it renders nothing until after
 * mount by construction (so there is no SSR/hydration mismatch on time), and
 * the interval's teardown is the subscription's own cleanup.
 */
export function HeaderClock({ className }: { className?: string }) {
  const seconds = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  if (seconds == null) return null

  const now = new Date(seconds * 1000)
  const parts = clockParts(now)

  return (
    <div
      className={cn("flex items-baseline gap-2 font-mono tabular-nums", className)}
      // One thing to a screen reader, and never announced on the tick.
      aria-label={`Current time ${parts.hhmm} ${parts.meridiem}`}
      aria-live="off"
    >
      <span className="text-2xs tracking-[0.14em] text-muted-foreground">
        {parts.dateLine}
      </span>
      <span className="text-sm text-foreground">{parts.hhmm}</span>
      <span className="text-2xs text-muted-foreground">{parts.seconds}</span>
      <span className="text-2xs tracking-[0.1em] text-muted-foreground">
        {parts.meridiem}
      </span>
      {/* Once a day the header agrees with almost every product shot ever
          taken — and with the hands on the brand mark. One line, no setting,
          no dismissal, and only for that minute. */}
      {now.getHours() % 12 === 10 && now.getMinutes() === 10 && (
        <span className="hidden text-2xs tracking-[0.12em] text-brass lg:inline">
          TEN PAST TEN — the whole collection agrees
        </span>
      )}
    </div>
  )
}

/** The running seconds, for anything that wants the same tick at its own size
 *  (glance mode sets the time large beside the watch's name). */
export function useClockSeconds(): number | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

/** Split out so every readout of the time formats it identically. */
export function clockParts(now: Date) {
  const pad = (n: number) => String(n).padStart(2, "0")
  const hours = now.getHours()
  return {
    dateLine: now
      .toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" })
      .toUpperCase(),
    hhmm: `${hours % 12 || 12}:${pad(now.getMinutes())}`,
    seconds: `:${pad(now.getSeconds())}`,
    meridiem: hours < 12 ? "AM" : "PM",
  }
}

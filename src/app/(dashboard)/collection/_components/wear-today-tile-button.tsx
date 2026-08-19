"use client"

import { useState, useTransition } from "react"
import { Check, CalendarPlus } from "lucide-react"
import { quickWear } from "@/lib/actions/wear-log-actions"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

/**
 * "Wear today" on a collection tile.
 *
 * The point of this living on the tile rather than only on the watch page:
 * tiles mode filtered to a box is a picture of that box, and a box is a
 * rotation. Logging what you actually put on should be one press from the
 * picture, not a round trip through a detail page.
 *
 * It sits inside a tile whose whole surface is a link to the watch, so every
 * interaction is stopped from bubbling — otherwise logging a wear would also
 * navigate away from the grid you are working through.
 */
export function WearTodayTileButton({
  watchId,
  name,
  className,
}: {
  watchId: string
  name: string
  className?: string
}) {
  const [isPending, startTransition] = useTransition()
  const [done, setDone] = useState(false)

  function wear(e: React.MouseEvent) {
    // The tile is a stretched link; without this the click would navigate.
    e.preventDefault()
    e.stopPropagation()
    if (done || isPending) return
    startTransition(async () => {
      const result = await quickWear(watchId)
      if (result.error) {
        toast.error(result.error)
      } else {
        setDone(true)
        toast.success(`${name} — wear logged.`)
      }
    })
  }

  return (
    <button
      type="button"
      onClick={wear}
      // A key press on the tile's link must not reach this, and vice versa.
      onKeyDown={(e) => e.stopPropagation()}
      disabled={isPending || done}
      aria-label={`Log a wear today for ${name}`}
      className={cn(
        // Ghost by default, brass on hover — the same restraint the display
        // trays used: a grid of brass buttons shouts, one under the pointer
        // does not.
        "flex h-7 w-full items-center justify-center gap-1.5 rounded-lg border text-2xs transition-colors",
        done
          ? "border-brass bg-brass/14 font-medium text-brass"
          : "border-border text-muted-foreground hover:border-brass hover:bg-brass/10 hover:text-brass",
        isPending && "opacity-60",
        className
      )}
    >
      {done ? (
        <>
          <Check className="h-3.5 w-3.5" aria-hidden="true" />
          Worn today
        </>
      ) : (
        <>
          <CalendarPlus className="h-3.5 w-3.5" aria-hidden="true" />
          {isPending ? "Logging…" : "Wear today"}
        </>
      )}
    </button>
  )
}

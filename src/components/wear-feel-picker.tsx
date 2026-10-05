"use client"

import { useOptimistic, useTransition } from "react"
import { toast } from "sonner"
import { setWearFeel } from "@/lib/actions/keep-actions"
import { WEAR_FEELS, wearFeelLabels, type WearFeel } from "@/lib/validations/keep"
import { cn } from "@/lib/utils"

/**
 * Loved it · Fine · Meh for one wear (00054). It is the wear signal The Edit
 * can use from the very first entry — how OFTEN you wear something needs
 * months of logging to mean anything across 170 watches. Clicking the active
 * choice clears it.
 */
export function WearFeelPicker({
  logId,
  value,
  onSaved,
  className,
}: {
  logId: string
  value: WearFeel | null
  onSaved?: (feel: WearFeel | null) => void
  className?: string
}) {
  const [optimistic, setOptimistic] = useOptimistic(value)
  const [pending, startTransition] = useTransition()

  function choose(next: WearFeel | null) {
    startTransition(async () => {
      setOptimistic(next)
      const res = await setWearFeel(logId, next)
      if (res.error) toast.error(res.error)
      else onSaved?.(next)
    })
  }

  return (
    <div
      role="radiogroup"
      aria-label="How did it feel?"
      aria-busy={pending}
      className={cn("flex h-7 shrink-0 overflow-hidden rounded-lg border border-border", className)}
    >
      {WEAR_FEELS.map((f) => (
        <button
          key={f}
          type="button"
          role="radio"
          aria-checked={optimistic === f}
          onClick={(e) => {
            e.stopPropagation()
            choose(optimistic === f ? null : f)
          }}
          className={cn(
            "px-2.5 text-xs transition-colors [&:not(:first-child)]:border-l [&:not(:first-child)]:border-border",
            optimistic === f ? "bg-brass/15 text-brass" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {wearFeelLabels[f]}
        </button>
      ))}
    </div>
  )
}

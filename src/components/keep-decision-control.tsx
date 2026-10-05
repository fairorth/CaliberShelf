"use client"

import { useOptimistic, useTransition } from "react"
import { toast } from "sonner"
import { setKeepFields } from "@/lib/actions/keep-actions"
import { KEEP_DECISIONS, keepDecisionLabels, type KeepDecision } from "@/lib/validations/keep"
import { cn } from "@/lib/utils"

/**
 * Keep · Maybe · Sell for one watch — the same segmented control wherever the
 * decision is made (The Edit's rows, the watch page's Sale zone). Clicking the
 * active step clears it back to undecided.
 */
export function KeepDecisionControl({
  watchId,
  value,
  size = "sm",
  className,
}: {
  watchId: string
  value: KeepDecision | null
  size?: "sm" | "md"
  className?: string
}) {
  const [optimistic, setOptimistic] = useOptimistic(value)
  const [pending, startTransition] = useTransition()

  function choose(next: KeepDecision | null) {
    startTransition(async () => {
      setOptimistic(next)
      const res = await setKeepFields(watchId, { keep_decision: next })
      if (res.error) toast.error(res.error)
    })
  }

  return (
    <div
      role="radiogroup"
      aria-label="Keep or sell"
      aria-busy={pending}
      className={cn(
        "flex shrink-0 overflow-hidden rounded-lg border border-border",
        size === "sm" ? "h-7" : "h-8",
        className
      )}
    >
      {KEEP_DECISIONS.map((opt) => (
        <button
          key={opt}
          type="button"
          role="radio"
          aria-checked={optimistic === opt}
          onClick={() => choose(optimistic === opt ? null : opt)}
          className={cn(
            "px-2.5 text-xs font-medium transition-colors [&:not(:first-child)]:border-l [&:not(:first-child)]:border-border",
            optimistic === opt ? "bg-brass/15 text-brass" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {keepDecisionLabels[opt]}
        </button>
      ))}
    </div>
  )
}

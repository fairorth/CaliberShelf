"use client"

import { useState, useTransition } from "react"
import { Switch } from "@/components/ui/switch"
import { setPriceTracking } from "@/lib/actions/price-tracking"
import { toast } from "sonner"

interface TrackMarketToggleProps {
  watchId: string
  enabled: boolean
  /** Tracking requires one; without it the switch explains itself. */
  hasReference: boolean
}

/**
 * The Market section's tracking switch — whether the monthly agent values this
 * watch, decided next to the value it produces rather than on the edit form.
 *
 * Optimistic: the switch moves at once and reverts if the server says no. The
 * alternative is a control that visibly lags a boolean.
 */
export function TrackMarketToggle({
  watchId,
  enabled,
  hasReference,
}: TrackMarketToggleProps) {
  const [on, setOn] = useState(enabled)
  const [pending, startTransition] = useTransition()

  function change(next: boolean) {
    setOn(next)
    startTransition(async () => {
      const result = await setPriceTracking(watchId, next)
      if (result.error) {
        setOn(!next)
        toast.error(result.error)
      } else {
        toast.success(next ? "Price tracking on." : "Price tracking off.")
      }
    })
  }

  return (
    <div className="flex items-center gap-2.5">
      <Switch
        id={`track-${watchId}`}
        checked={on}
        onCheckedChange={change}
        disabled={pending || (!on && !hasReference)}
      />
      <label
        htmlFor={`track-${watchId}`}
        className="cursor-pointer text-xs text-muted-foreground"
      >
        Track market value
        {!hasReference && !on && (
          <span className="block text-2xs">Needs a reference number</span>
        )}
      </label>
    </div>
  )
}

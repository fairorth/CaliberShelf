"use client"

import { useTransition } from "react"
import { Button } from "@/components/ui/button"
import { quickWear } from "@/lib/actions/wear-log-actions"
import { toast } from "sonner"

interface WearTodayButtonProps {
  watchId: string
}

/**
 * The action alone. The wear COUNT used to sit under this button, which meant
 * a never-worn watch said zero three times on one screen — here, on the WEAR
 * card, and again in that card's context line. Phase 9 §2.3 keeps the count in
 * one place, the WEAR card, and leaves the header the thing you press.
 */
export function WearTodayButton({ watchId }: WearTodayButtonProps) {
  const [isPending, startTransition] = useTransition()

  function handleQuickWear() {
    startTransition(async () => {
      const result = await quickWear(watchId)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Wear logged!")
      }
    })
  }

  return (
    <Button variant="outline" size="sm" onClick={handleQuickWear} disabled={isPending}>
      Wore Today
    </Button>
  )
}

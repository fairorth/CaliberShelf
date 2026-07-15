"use client"

import { useTransition } from "react"
import { Button } from "@/components/ui/button"
import { quickWear } from "@/lib/actions/wear-log-actions"
import { toast } from "sonner"

interface WearTodayButtonProps {
  watchId: string
  wearInfo?: { count: number; lastWorn: string | null }
}

function formatLastWorn(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00")
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export function WearTodayButton({ watchId, wearInfo }: WearTodayButtonProps) {
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
    <div className="flex flex-col items-end gap-1.5">
      <Button variant="outline" size="sm" onClick={handleQuickWear} disabled={isPending}>
        ⌚ Wore Today
      </Button>
      {wearInfo && (
        <span className="text-xs text-muted-foreground">
          Worn {wearInfo.count} {wearInfo.count === 1 ? "time" : "times"}
          {wearInfo.lastWorn && ` · Last: ${formatLastWorn(wearInfo.lastWorn)}`}
        </span>
      )}
    </div>
  )
}

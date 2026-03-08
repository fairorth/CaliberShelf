"use client"

import { useTransition } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { deleteWatch } from "@/lib/actions/watch-actions"
import { quickWear } from "@/lib/actions/wear-log-actions"
import { labelColorMap } from "@/lib/validations/label"
import { toast } from "sonner"
import type { Watch, Brand, Label } from "@/lib/types/watch"
import type { LabelColor } from "@/lib/validations/label"

interface WatchDetailHeaderProps {
  watch: Watch & { brand: Brand }
  labels?: Label[]
  wearInfo?: { count: number; lastWorn: string | null }
}

export function WatchDetailHeader({ watch, labels = [], wearInfo }: WatchDetailHeaderProps) {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteWatch(watch.id)
      if (result.error) {
        toast.error(result.error)
      }
      // Redirect happens in the server action
    })
  }

  function handleQuickWear() {
    startTransition(async () => {
      const result = await quickWear(watch.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Wear logged!")
      }
    })
  }

  function formatLastWorn(dateStr: string): string {
    const date = new Date(dateStr + "T00:00:00")
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" render={<Link href="/dashboard" />}>
            &larr; Gallery
          </Button>
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              {watch.brand.name}
            </p>
            <h1 className="text-2xl font-bold tracking-tight">
              {watch.nickname || watch.model}
            </h1>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleQuickWear}
            disabled={isPending}
          >
            ⌚ Wore Today
          </Button>
          <Button variant="outline" size="sm" render={<Link href={`/watch/${watch.id}/edit`} />}>
            Edit
          </Button>
          <AlertDialog>
            <AlertDialogTrigger render={<Button variant="destructive" size="sm" disabled={isPending} />}>
              Delete
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this watch?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete &quot;{watch.brand.name} {watch.model}&quot;
                  and all its photos. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  Delete Watch
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Wear info + Label badges row */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pl-[52px]">
        {wearInfo && (
          <span className="text-xs text-muted-foreground">
            Worn {wearInfo.count} {wearInfo.count === 1 ? "time" : "times"}
            {wearInfo.lastWorn && ` · Last: ${formatLastWorn(wearInfo.lastWorn)}`}
          </span>
        )}
        {labels.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {labels.map((label) => {
              const colors = labelColorMap[label.color as LabelColor] ?? labelColorMap.blue
              return (
                <span
                  key={label.id}
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors.bg} ${colors.text}`}
                >
                  {label.name}
                </span>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"
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
import { Button } from "@/components/ui/button"
import { deleteRater, deleteRatingSession } from "@/lib/actions/rating-actions"

/**
 * Remove a player (and all their ratings) or one segment's result, behind a
 * confirmation. `afterHref` is where to go once the thing on screen is gone —
 * removing the selected player sends the report back to Everyone.
 */
export function RemoveRatingButton({
  target,
  id,
  title,
  description,
  label,
  afterHref,
}: {
  target: "rater" | "session"
  id: string
  title: string
  description: string
  /** Visible text; omit for an icon-only button (title becomes its label). */
  label?: string
  afterHref?: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function remove() {
    startTransition(async () => {
      const result = target === "rater" ? await deleteRater(id) : await deleteRatingSession(id)
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      toast.success(target === "rater" ? "Player removed" : "Result removed")
      if (afterHref) router.replace(afterHref)
    })
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            disabled={isPending}
            aria-label={label ? undefined : title}
            className="text-muted-foreground hover:text-destructive"
          />
        }
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
        {label}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={remove}>Remove</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

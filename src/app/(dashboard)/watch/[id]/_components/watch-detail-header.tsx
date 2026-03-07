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
import { toast } from "sonner"
import type { Watch, Brand } from "@/lib/types/watch"

interface WatchDetailHeaderProps {
  watch: Watch & { brand: Brand }
}

export function WatchDetailHeader({ watch }: WatchDetailHeaderProps) {
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

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" render={<Link href="/collection" />}>
          &larr; Back
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
  )
}

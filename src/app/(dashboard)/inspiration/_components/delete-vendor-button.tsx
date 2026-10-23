"use client"

import { Trash2 } from "lucide-react"
import { useTransition } from "react"
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
import { deleteVendor } from "@/lib/actions/admired-actions"
import type { AdmiredVendorView } from "@/lib/queries/admired"

/** Delete a vendor behind a confirmation that says what goes with it. */
export function DeleteVendorButton({ vendor }: { vendor: AdmiredVendorView }) {
  const [isPending, startTransition] = useTransition()
  const watches = vendor.watches.length
  const frames = vendor.photos.length

  const parts = [
    watches > 0 && `its ${watches} admired ${watches === 1 ? "watch" : "watches"} and all of their photos`,
    frames > 0 && `its ${frames} booth ${frames === 1 ? "photo" : "photos"}`,
  ].filter(Boolean)
  const description =
    parts.length > 0
      ? `This also deletes ${parts.join(", and ")}. This can't be undone.`
      : "This can't be undone."

  function remove() {
    startTransition(async () => {
      const result = await deleteVendor(vendor.id)
      if (result.error) toast.error(result.error)
      else toast.success("Vendor deleted")
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
            aria-label={`Delete ${vendor.display_name}`}
            className="text-muted-foreground hover:text-destructive"
          />
        }
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {vendor.display_name}?</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={remove}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

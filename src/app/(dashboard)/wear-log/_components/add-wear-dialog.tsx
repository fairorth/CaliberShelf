"use client"

import { useActionState, useEffect, useRef } from "react"
import Image from "next/image"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createWearLog } from "@/lib/actions/wear-log-actions"
import type { WearLogActionState } from "@/lib/actions/wear-log-actions"
import { toast } from "sonner"
import type { WatchWithCover } from "@/lib/types/watch"

interface AddWearDialogProps {
  watches: WatchWithCover[]
  defaultDate?: string // "YYYY-MM-DD"
  onSuccess?: () => void
  /** Controlled mode */
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function AddWearDialog({
  watches,
  defaultDate,
  onSuccess,
  open,
  onOpenChange,
}: AddWearDialogProps) {
  const [state, formAction, isPending] = useActionState<WearLogActionState, FormData>(
    createWearLog,
    {}
  )
  const formRef = useRef<HTMLFormElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (state.success) {
      toast.success("Wear logged!")
      formRef.current?.reset()
      if (onOpenChange) {
        onOpenChange(false)
      } else {
        closeRef.current?.click()
      }
      onSuccess?.()
    }
    if (state.error) {
      toast.error(state.error)
    }
  }, [state, onSuccess, onOpenChange])

  const today = new Date().toISOString().slice(0, 10)

  const dialogBody = (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Log a Wear</DialogTitle>
        <DialogDescription>
          Record which watch you wore and when.
        </DialogDescription>
      </DialogHeader>

      <form ref={formRef} action={formAction} className="space-y-4">
        {/* Watch selector */}
        <div className="space-y-2">
          <Label htmlFor="wear_watch_id">Watch</Label>
          <select
            id="wear_watch_id"
            name="watch_id"
            required
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <option value="">Select a watch...</option>
            {watches.map((w) => (
              <option key={w.id} value={w.id}>
                {w.brand.name} {w.model}
                {w.nickname ? ` (${w.nickname})` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Date */}
        <div className="space-y-2">
          <Label htmlFor="wear_date">Date</Label>
          <Input
            id="wear_date"
            name="worn_date"
            type="date"
            defaultValue={defaultDate ?? today}
            max={today}
            required
          />
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="wear_notes">Notes (optional)</Label>
          <Textarea
            id="wear_notes"
            name="notes"
            placeholder="e.g., Wore to dinner, great on leather strap..."
            rows={2}
          />
        </div>

        {/* Quick watch thumbnails */}
        {watches.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Quick select:</p>
            <div className="flex flex-wrap gap-2">
              {watches.slice(0, 6).map((w) => (
                <button
                  key={w.id}
                  type="button"
                  className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-border transition-all hover:ring-2 hover:ring-ring"
                  title={`${w.brand.name} ${w.model}`}
                  onClick={() => {
                    const sel = document.getElementById("wear_watch_id") as HTMLSelectElement
                    if (sel) sel.value = w.id
                  }}
                >
                  {w.cover_photo_url ? (
                    <Image
                      src={w.cover_photo_url}
                      alt={w.model}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  ) : (
                    <span className="text-xs font-medium text-muted-foreground">
                      {w.brand.name.charAt(0)}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        <DialogFooter>
          <DialogClose render={<Button variant="outline" ref={closeRef} />}>
            Cancel
          </DialogClose>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Logging..." : "Log Wear"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )

  // Controlled mode (from calendar day click)
  if (open !== undefined) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        {dialogBody}
      </Dialog>
    )
  }

  // Uncontrolled mode (with trigger button)
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        + Log Wear
      </DialogTrigger>
      {dialogBody}
    </Dialog>
  )
}

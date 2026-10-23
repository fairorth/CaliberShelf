"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { updateVendor } from "@/lib/actions/admired-actions"
import type { AdmiredVendorView } from "@/lib/queries/admired"
import { AdmiredPhotoViewer } from "./admired-photo-viewer"

/** Edit a vendor (booth): its booth / name frames, its name and notes. */
export function AdmiredVendorDialog({
  vendor,
  photoId,
  onClose,
}: {
  vendor: AdmiredVendorView | null
  /** The frame to open on, when opened from the strip. */
  photoId?: string | null
  onClose: () => void
}) {
  return (
    <Dialog open={vendor != null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-3xl">
        {/* Keyed so each vendor gets a fresh form. */}
        {vendor && <VendorEditor key={vendor.id} vendor={vendor} photoId={photoId} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  )
}

function VendorEditor({
  vendor,
  photoId,
  onClose,
}: {
  vendor: AdmiredVendorView
  photoId?: string | null
  onClose: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState(vendor.name ?? "")
  const [notes, setNotes] = useState(vendor.notes ?? "")

  function save() {
    startTransition(async () => {
      const result = await updateVendor(vendor.id, { name, notes })
      if (result.error) toast.error(result.error)
      else {
        toast.success("Saved")
        onClose()
      }
    })
  }

  return (
    <div className="space-y-5">
      <div>
        <DialogTitle className="font-display text-md">{vendor.display_name}</DialogTitle>
        <DialogDescription className="text-xs">
          {vendor.name_source === "read"
            ? "Named from their sign — anything you type here wins."
            : vendor.name
              ? "The booth these watches were seen at."
              : "No name yet — type it, or shoot their sign as a Name frame on the phone."}
        </DialogDescription>
      </div>

      <AdmiredPhotoViewer photos={vendor.photos} initialId={photoId} />

      <div className="space-y-1.5">
        <Label htmlFor="vendor-name">Name</Label>
        <Input
          id="vendor-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={120}
          placeholder={vendor.display_name}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="vendor-notes">Notes</Label>
        <Textarea
          id="vendor-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="Who was at the booth, where they're based, what you talked about…"
        />
      </div>

      <div className="flex justify-end gap-2.5 border-t border-border pt-4">
        <Button variant="outline" onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button onClick={save} disabled={isPending} className="bg-brass text-brass-foreground hover:bg-brass/90">
          {isPending ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  )
}

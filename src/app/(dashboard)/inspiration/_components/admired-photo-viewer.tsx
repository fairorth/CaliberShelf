"use client"

import { ScrollText, Signpost, Trash2 } from "lucide-react"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { deleteAdmiredPhoto } from "@/lib/actions/admired-actions"
import type { AdmiredPhotoView } from "@/lib/queries/admired"
import { admiredPhotoKindLabels } from "@/lib/validations/admired"
import { cn } from "@/lib/utils"

/**
 * The large view + thumbnail strip used by both Admired editors (a watch's
 * frames, a vendor's booth / name frames), with "Delete this photo".
 */
export function AdmiredPhotoViewer({
  photos,
  initialId,
}: {
  photos: AdmiredPhotoView[]
  initialId?: string | null
}) {
  const [isPending, startTransition] = useTransition()
  const [viewing, setViewing] = useState(initialId ?? photos[0]?.id ?? null)
  const current = photos.find((p) => p.id === viewing) ?? photos[0]

  function removePhoto(photoId: string) {
    if (!confirm("Delete this photo?")) return
    startTransition(async () => {
      const result = await deleteAdmiredPhoto(photoId)
      if (result.error) toast.error(result.error)
    })
  }

  if (photos.length === 0) return null

  return (
    <div className="space-y-3">
      {current?.full_url && (
        <div className="relative overflow-hidden rounded-xl bg-surface-photo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={current.full_url} alt="" className="max-h-[50dvh] w-full object-contain" />
        </div>
      )}
      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {photos.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setViewing(p.id)}
              className={cn(
                "relative block h-16 w-16 shrink-0 overflow-hidden rounded-lg border",
                p.id === current?.id ? "border-brass" : "border-border"
              )}
              aria-label={`${admiredPhotoKindLabels[p.kind]} photo`}
            >
              {p.thumb_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.thumb_url} alt="" className="h-full w-full object-cover" />
              )}
              {(p.kind === "placard" || p.kind === "name") && (
                <span className="absolute inset-x-0 bottom-0 flex justify-center bg-background/80 py-0.5">
                  {p.kind === "placard" ? (
                    <ScrollText className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                  ) : (
                    <Signpost className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                  )}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
      {current && (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={() => removePhoto(current.id)} disabled={isPending}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Delete this photo
          </Button>
        </div>
      )}
    </div>
  )
}

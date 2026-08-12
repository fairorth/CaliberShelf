"use client"

import { useCallback, useEffect, useRef, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import {
  uploadStrapPhoto,
  deleteStrapPhoto,
  setStrapCoverPhoto,
} from "@/lib/actions/strap-photo-actions"
import { toast } from "sonner"
import type { StrapPhoto } from "@/lib/types/strap"

interface StrapPhotoManagerProps {
  strapId: string
  photos: Array<StrapPhoto & { url: string | null }>
}

export function StrapPhotoManager({ strapId, photos }: StrapPhotoManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()
  const [preview, setPreview] = useState<string | null>(null)

  const uploadFile = useCallback(
    (file: File) => {
      const url = URL.createObjectURL(file)
      setPreview(url)

      const formData = new FormData()
      formData.set("photo", file)

      startTransition(async () => {
        try {
          const result = await uploadStrapPhoto(strapId, formData)
          if (result.error) {
            toast.error(result.error)
          } else {
            toast.success("Photo uploaded!")
          }
        } catch {
          toast.error("Upload failed. The photo may be too large — try a smaller image.")
        }
        setPreview(null)
        if (fileInputRef.current) fileInputRef.current.value = ""
      })
    },
    [strapId]
  )

  // Paste-to-upload, mirroring the watch photo uploader — handy for product
  // shots copied from a strap maker's store page.
  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      if (isPending) return
      const item = Array.from(e.clipboardData?.items ?? []).find((i) =>
        i.type.startsWith("image/")
      )
      const pasted = item?.getAsFile()
      if (pasted) {
        e.preventDefault()
        uploadFile(pasted)
      }
    }
    window.addEventListener("paste", onPaste)
    return () => window.removeEventListener("paste", onPaste)
  }, [isPending, uploadFile])

  function handleDelete(photoId: string) {
    if (!confirm("Delete this photo?")) return
    startTransition(async () => {
      const result = await deleteStrapPhoto(photoId, strapId)
      if (result.error) toast.error(result.error)
    })
  }

  function handleSetCover(photoId: string) {
    startTransition(async () => {
      const result = await setStrapCoverPhoto(photoId, strapId)
      if (result.error) toast.error(result.error)
      else toast.success("Cover photo updated")
    })
  }

  return (
    <div className="space-y-3">
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="group relative aspect-square overflow-hidden rounded-md border"
            >
              {photo.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo.url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-muted" />
              )}
              {photo.is_cover && (
                <span className="absolute left-1 top-1 rounded-full bg-background/85 px-1.5 py-0.5 text-2xs font-medium text-brass backdrop-blur">
                  ★ cover
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1 bg-gradient-to-t from-black/60 to-transparent p-1 opacity-0 transition-opacity group-hover:opacity-100">
                {!photo.is_cover && (
                  <button
                    type="button"
                    onClick={() => handleSetCover(photo.id)}
                    disabled={isPending}
                    className="rounded bg-background/80 px-1.5 py-0.5 text-2xs hover:bg-background"
                    title="Set as cover"
                  >
                    ★
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(photo.id)}
                  disabled={isPending}
                  className="rounded bg-background/80 px-1.5 py-0.5 text-2xs hover:bg-background"
                  title="Delete photo"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
          {preview && (
            <div className="relative aspect-square overflow-hidden rounded-md border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Upload preview" className="h-full w-full object-cover opacity-50" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            </div>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) uploadFile(file)
        }}
        className="hidden"
        disabled={isPending}
      />
      <Button
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        disabled={isPending}
        className="w-full"
      >
        {isPending ? "Uploading..." : "Upload Photo"}
      </Button>
      <p className="text-center font-mono text-2xs text-muted-foreground">
        or paste a copied image (Ctrl+V)
      </p>
    </div>
  )
}

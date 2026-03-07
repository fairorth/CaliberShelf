"use client"

import { useState, useTransition } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { deleteWatchPhoto, setCoverPhoto } from "@/lib/actions/photo-actions"
import { toast } from "sonner"
import type { WatchPhoto } from "@/lib/types/watch"

interface PhotoGalleryProps {
  photos: WatchPhoto[]
  photoUrls: Record<string, string>
  watchId: string
}

export function PhotoGallery({ photos, photoUrls, watchId }: PhotoGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isPending, startTransition] = useTransition()

  if (photos.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-lg border border-dashed bg-muted">
        <div className="text-center">
          <span className="text-5xl">⌚</span>
          <p className="mt-2 text-sm text-muted-foreground">No photos yet</p>
        </div>
      </div>
    )
  }

  const selectedPhoto = photos[selectedIndex]
  const selectedUrl = selectedPhoto
    ? photoUrls[selectedPhoto.storage_path]
    : undefined

  function handleDelete(photoId: string) {
    startTransition(async () => {
      const result = await deleteWatchPhoto(photoId, watchId)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Photo deleted")
        if (selectedIndex >= photos.length - 1 && selectedIndex > 0) {
          setSelectedIndex(selectedIndex - 1)
        }
      }
    })
  }

  function handleSetCover(photoId: string) {
    startTransition(async () => {
      const result = await setCoverPhoto(photoId, watchId)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Cover photo updated")
      }
    })
  }

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
        {selectedUrl ? (
          <Image
            src={selectedUrl}
            alt="Watch photo"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            Loading...
          </div>
        )}
        {selectedPhoto?.is_cover && (
          <Badge className="absolute left-2 top-2">Cover</Badge>
        )}
      </div>

      {/* Photo actions */}
      {selectedPhoto && (
        <div className="flex gap-2">
          {!selectedPhoto.is_cover && (
            <Button
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => handleSetCover(selectedPhoto.id)}
            >
              Set as Cover
            </Button>
          )}
          <AlertDialog>
            <AlertDialogTrigger render={<Button variant="destructive" size="sm" disabled={isPending} />}>
              Delete
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this photo?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove the photo. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleDelete(selectedPhoto.id)}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      {/* Thumbnails */}
      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {photos.map((photo, index) => {
            const url = photoUrls[photo.storage_path]
            return (
              <button
                key={photo.id}
                onClick={() => setSelectedIndex(index)}
                className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border-2 transition-colors ${
                  index === selectedIndex
                    ? "border-primary"
                    : "border-transparent hover:border-muted-foreground/30"
                }`}
              >
                {url ? (
                  <Image
                    src={url}
                    alt={`Thumbnail ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                ) : (
                  <div className="h-full w-full bg-muted" />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

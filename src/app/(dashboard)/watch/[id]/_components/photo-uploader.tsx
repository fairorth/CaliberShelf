"use client"

import { useState } from "react"
import { PhotoDrop } from "@/components/photo-drop"
import { uploadWatchPhoto } from "@/lib/actions/photo-actions"
import { toast } from "sonner"

interface PhotoUploaderProps {
  watchId: string
}

/** Watch-page uploader — the shared PhotoDrop with immediate upload and
 *  per-file progress (A3). */
export function PhotoUploader({ watchId }: PhotoUploaderProps) {
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)

  async function handleFiles(files: File[]) {
    setProgress({ done: 0, total: files.length })
    let failed = 0
    for (let i = 0; i < files.length; i++) {
      const formData = new FormData()
      formData.set("photo", files[i])
      try {
        const result = await uploadWatchPhoto(watchId, formData)
        if (result.error) {
          failed++
          toast.error(`${files[i].name}: ${result.error}`)
        }
      } catch {
        failed++
        toast.error(`${files[i].name}: upload failed — the photo may be too large.`)
      }
      setProgress({ done: i + 1, total: files.length })
    }
    const uploaded = files.length - failed
    if (uploaded > 0) {
      toast.success(uploaded === 1 ? "Photo uploaded" : `${uploaded} photos uploaded`)
    }
    setProgress(null)
  }

  return (
    <PhotoDrop
      multiple
      paste
      onFiles={(files) => void handleFiles(files)}
      busy={progress !== null}
      busyLabel={
        progress ? `Uploading ${Math.min(progress.done + 1, progress.total)} of ${progress.total}…` : "Uploading…"
      }
    />
  )
}

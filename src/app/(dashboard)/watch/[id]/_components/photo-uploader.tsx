"use client"

import { useRef, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { uploadWatchPhoto } from "@/lib/actions/photo-actions"
import { toast } from "sonner"

interface PhotoUploaderProps {
  watchId: string
}

export function PhotoUploader({ watchId }: PhotoUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()
  const [preview, setPreview] = useState<string | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      // Show preview
      const url = URL.createObjectURL(file)
      setPreview(url)

      // Upload immediately
      const formData = new FormData()
      formData.set("photo", file)

      startTransition(async () => {
        const result = await uploadWatchPhoto(watchId, formData)
        if (result.error) {
          toast.error(result.error)
        } else {
          toast.success("Photo uploaded!")
        }
        setPreview(null)
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      })
    }
  }

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        onChange={handleFileChange}
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

      {preview && (
        <div className="relative aspect-square w-20 overflow-hidden rounded-md border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Upload preview"
            className="h-full w-full object-cover opacity-50"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        </div>
      )}
    </div>
  )
}

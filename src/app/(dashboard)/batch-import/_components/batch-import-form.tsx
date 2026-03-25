"use client"

import { useState, useRef, useTransition, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { batchImportWatches } from "@/lib/actions/batch-import-actions"
import type { BatchImportResult } from "@/lib/actions/batch-import-actions"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { Category } from "@/lib/types/watch"

interface BatchImportFormProps {
  categories: Category[]
}

interface PreviewImage {
  file: File
  url: string
}

export function BatchImportForm({ categories }: BatchImportFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [images, setImages] = useState<PreviewImage[]>([])
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "")
  const [isDragging, setIsDragging] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<BatchImportResult | null>(null)

  const addFiles = useCallback((files: FileList | File[]) => {
    const newImages: PreviewImage[] = []
    for (const file of Array.from(files)) {
      if (file.type.startsWith("image/")) {
        newImages.push({ file, url: URL.createObjectURL(file) })
      }
    }
    setImages((prev) => [...prev, ...newImages])
    setResult(null)
  }, [])

  function removeImage(index: number) {
    setImages((prev) => {
      const removed = prev[index]
      URL.revokeObjectURL(removed.url)
      return prev.filter((_, i) => i !== index)
    })
  }

  function clearAll() {
    for (const img of images) {
      URL.revokeObjectURL(img.url)
    }
    setImages([])
    setResult(null)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files)
    }
  }

  function handleImport() {
    if (images.length === 0 || !categoryId) return

    startTransition(async () => {
      const formData = new FormData()
      formData.set("category_id", categoryId)
      for (const img of images) {
        formData.append("photos", img.file)
      }

      const importResult = await batchImportWatches(formData)
      setResult(importResult)

      if (importResult.successCount === importResult.totalRequested) {
        toast.success(`All ${importResult.successCount} watches imported!`)
        // Clear images after full success
        for (const img of images) {
          URL.revokeObjectURL(img.url)
        }
        setImages([])
      } else if (importResult.successCount > 0) {
        toast.success(`${importResult.successCount} of ${importResult.totalRequested} watches imported.`)
      } else {
        toast.error("Import failed. Check errors below.")
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <Card className="border-dashed">
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Upload watch photos to quickly create placeholder entries. Each image
            creates a watch named <span className="font-medium text-foreground">&quot;Batch 1&quot;</span>,{" "}
            <span className="font-medium text-foreground">&quot;Batch 2&quot;</span>, etc. with an{" "}
            <span className="font-medium text-foreground">&quot;Unknown&quot;</span> brand.
            You can then edit each watch individually to add the real details.
          </p>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-sm space-y-2">
            <Label htmlFor="batch_category">Default Category *</Label>
            <Select
              value={categoryId}
              onValueChange={(val) => { if (val) setCategoryId(val) }}
            >
              <SelectTrigger id="batch_category">
                <span>
                  {categoryId
                    ? categories.find((c) => c.id === categoryId)?.name ?? "Select category"
                    : "Select category"}
                </span>
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Drop zone */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/heic"
        onChange={(e) => {
          if (e.target.files) addFiles(e.target.files)
          e.target.value = "" // reset so same files can be re-selected
        }}
        className="hidden"
      />

      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragEnter={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-muted/30"
        )}
      >
        <span className="text-4xl">📸</span>
        <div className="text-center">
          <p className="text-sm font-medium">
            {isDragging ? "Drop images here" : "Drag & drop watch photos here"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            or click to browse · JPEG, PNG, WebP, HEIC · max 10MB each
          </p>
        </div>
      </div>

      {/* Preview grid */}
      {images.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">
              {images.length} {images.length === 1 ? "image" : "images"} selected
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={clearAll}>
              Clear all
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8">
              {images.map((img, i) => (
                <div key={i} className="group relative aspect-square overflow-hidden rounded-lg border">
                  <Image
                    src={img.url}
                    alt={img.file.name}
                    fill
                    className="object-cover"
                    sizes="120px"
                  />
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeImage(i) }}
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-[10px] text-white opacity-0 transition-opacity hover:bg-destructive group-hover:opacity-100"
                    title="Remove"
                  >
                    ✕
                  </button>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-1 pb-1 pt-4">
                    <p className="truncate text-[9px] font-medium text-white">
                      Batch {i + 1}
                    </p>
                  </div>
                </div>
              ))}

              {/* Add more button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex aspect-square items-center justify-center rounded-lg border-2 border-dashed border-border text-2xl text-muted-foreground transition-colors hover:border-primary/50 hover:bg-muted/30"
                title="Add more images"
              >
                +
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import button */}
      {images.length > 0 && !result && (
        <div className="flex justify-end">
          <Button
            onClick={handleImport}
            disabled={isPending || !categoryId}
            size="lg"
          >
            {isPending
              ? `Importing ${images.length} watches...`
              : `Import ${images.length} ${images.length === 1 ? "Watch" : "Watches"}`}
          </Button>
        </div>
      )}

      {/* Progress indicator */}
      {isPending && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-center gap-3 py-4">
            <span className="animate-spin text-lg">⏳</span>
            <p className="text-sm">
              Creating watches and uploading photos... This may take a moment for large batches.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && (
        <Card className={result.errors.length > 0 ? "border-amber-500/30" : "border-emerald-500/30"}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              {result.errors.length === 0 ? (
                <>
                  <span className="text-emerald-600">✓</span>
                  Import Complete
                </>
              ) : (
                <>
                  <span className="text-amber-600">⚠</span>
                  Import Complete with Issues
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">
              <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                {result.successCount}
              </span>{" "}
              of {result.totalRequested} watches imported successfully.
            </p>

            {result.errors.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Errors:</p>
                {result.errors.map((err, i) => (
                  <p key={i} className="text-xs text-destructive">
                    {err}
                  </p>
                ))}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" size="sm" render={<Link href="/collection" />}>
                View Collection
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setResult(null)}
              >
                Import More
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

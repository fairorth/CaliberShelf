"use client"

import { useState, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { Check, X } from "lucide-react"
import { PhotoDrop } from "@/components/photo-drop"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
  prepareBatchImport,
  importSingleWatch,
  finalizeBatchImport,
} from "@/lib/actions/batch-import-actions"
import { toast } from "sonner"
import type { Category } from "@/lib/types/watch"

interface BatchImportFormProps {
  categories: Category[]
}

interface PreviewImage {
  file: File
  url: string
}

interface ImportResult {
  totalRequested: number
  successCount: number
  errors: string[]
}

export function BatchImportForm({ categories }: BatchImportFormProps) {
  const [images, setImages] = useState<PreviewImage[]>([])
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "")
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [result, setResult] = useState<ImportResult | null>(null)

  // Files arrive already downscaled from PhotoDrop (A3).
  const addFiles = useCallback((files: File[]) => {
    setImages((prev) => [
      ...prev,
      ...files.map((file) => ({ file, url: URL.createObjectURL(file) })),
    ])
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

  async function handleImport() {
    if (images.length === 0 || !categoryId) return

    setImporting(true)
    setProgress({ current: 0, total: images.length })

    // Step 1: Prepare (get brand ID + batch numbering)
    const setup = await prepareBatchImport()
    if (setup.error || !setup.brandId || !setup.nextBatchNum) {
      toast.error(setup.error ?? "Failed to prepare import.")
      setImporting(false)
      return
    }

    // Step 2: Import one image at a time
    const errors: string[] = []
    let successCount = 0

    for (let i = 0; i < images.length; i++) {
      setProgress({ current: i + 1, total: images.length })

      const img = images[i]
      const batchName = `Batch ${setup.nextBatchNum + i}`

      const formData = new FormData()
      formData.set("brand_id", setup.brandId)
      formData.set("category_id", categoryId)
      formData.set("batch_name", batchName)
      formData.set("photo", img.file)

      const result = await importSingleWatch(formData)

      if (result.success) {
        successCount++
        if (result.error) {
          // Watch created but photo failed
          errors.push(`${batchName} (${img.file.name}): ${result.error}`)
        }
      } else {
        errors.push(`${batchName} (${img.file.name}): ${result.error ?? "Unknown error"}`)
      }
    }

    // Step 3: Revalidate paths
    await finalizeBatchImport()

    const importResult: ImportResult = {
      totalRequested: images.length,
      successCount,
      errors,
    }
    setResult(importResult)
    setImporting(false)

    if (successCount === images.length && errors.length === 0) {
      toast.success(`All ${successCount} watches imported!`)
      for (const img of images) {
        URL.revokeObjectURL(img.url)
      }
      setImages([])
    } else if (successCount > 0) {
      toast.success(`${successCount} of ${images.length} watches imported.`)
    } else {
      toast.error("Import failed. Check errors below.")
    }
  }

  const progressPercent = progress.total > 0
    ? Math.round((progress.current / progress.total) * 100)
    : 0

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
          <CardTitle className="text-sm">Settings</CardTitle>
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

      {/* Drop zone — the shared upload surface, downscales every file (A3). */}
      {!importing && (
        <PhotoDrop
          multiple
          onFiles={addFiles}
          label={<>Drag &amp; drop watch photos here, or <span className="font-medium">browse</span></>}
        />
      )}

      {/* Preview grid */}
      {images.length > 0 && !importing && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm">
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
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-2xs text-white opacity-0 transition-opacity hover:bg-destructive group-hover:opacity-100"
                    title="Remove"
                  >
                    <X className="h-3 w-3" aria-hidden="true" />
                  </button>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-1 pb-1 pt-4">
                    <p className="truncate text-2xs font-medium text-white">
                      Batch {i + 1}
                    </p>
                  </div>
                </div>
              ))}

            </div>
          </CardContent>
        </Card>
      )}

      {/* Import button */}
      {images.length > 0 && !result && !importing && (
        <div className="flex justify-end">
          <Button
            onClick={handleImport}
            disabled={!categoryId}
            size="lg"
          >
            Import {images.length} {images.length === 1 ? "Watch" : "Watches"}
          </Button>
        </div>
      )}

      {/* Progress */}
      {importing && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="space-y-3 py-4">
            <div className="flex items-center justify-between text-sm">
              <span>
                Importing watch {progress.current} of {progress.total}...
              </span>
              <span className="font-semibold">{progressPercent}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && (
        <Card className={result.errors.length > 0 ? "border-destructive/30" : "border-brass/30"}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              {result.errors.length === 0 ? (
                <>
                  <Check className="h-4 w-4 text-brass" aria-hidden="true" />
                  Import Complete
                </>
              ) : (
                <>
                  <span className="text-destructive">⚠</span>
                  Import Complete with Issues
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">
              <span className="font-semibold text-brass">
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

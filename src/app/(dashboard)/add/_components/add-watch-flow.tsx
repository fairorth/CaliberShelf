"use client"

import { useRef, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { BrandCombobox } from "@/components/brand-combobox"
import { createWatchWithPhoto } from "@/lib/actions/watch-actions"
import { toast } from "sonner"
import type { Brand, Category } from "@/lib/types/watch"

type Step = "capture" | "form"

interface AddWatchFlowProps {
  brands: Brand[]
  categories: Category[]
}

export function AddWatchFlow({ brands, categories }: AddWatchFlowProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<Step>("capture")
  const [capturedFile, setCapturedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState("")
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleFileCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setCapturedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setStep("form")
  }

  function handleSkipPhoto() {
    setCapturedFile(null)
    setPreviewUrl(null)
    setStep("form")
  }

  function handleBackToCapture() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setCapturedFile(null)
    setPreviewUrl(null)
    setStep("capture")
    // Reset file inputs
    if (cameraInputRef.current) cameraInputRef.current.value = ""
    if (galleryInputRef.current) galleryInputRef.current.value = ""
  }

  function handleSubmit(formData: FormData) {
    // Attach the captured photo if present
    if (capturedFile) {
      formData.set("photo", capturedFile)
    }

    setError(null)
    startTransition(async () => {
      try {
        const result = await createWatchWithPhoto(formData)
        if (result.error) {
          setError(result.error)
          toast.error(result.error)
        }
        // On success, server action redirects to /watch/{id}
      } catch {
        toast.error("Failed to create watch. Try again.")
      }
    })
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Add Watch</h1>

      {/* Hidden inputs for camera & gallery */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        capture="environment"
        onChange={handleFileCapture}
        className="hidden"
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        onChange={handleFileCapture}
        className="hidden"
      />

      {/* Step 1: Capture */}
      {step === "capture" && (
        <div className="flex flex-col items-center gap-6 py-8">
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-primary bg-primary/10 text-5xl transition-transform active:scale-95"
            aria-label="Take photo"
          >
            📷
          </button>
          <p className="text-sm text-muted-foreground">
            Take a photo of your watch
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => galleryInputRef.current?.click()}
            >
              Choose from Gallery
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkipPhoto}
            >
              Skip Photo
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Quick form */}
      {step === "form" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleBackToCapture}>
              &larr; Back
            </Button>
          </div>

          {/* Photo preview */}
          {previewUrl && (
            <div className="flex justify-center">
              <div className="relative h-32 w-32 overflow-hidden rounded-lg border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Captured"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <form action={handleSubmit} className="space-y-4">
            {/* Brand */}
            <div className="space-y-2">
              <Label>Brand *</Label>
              <BrandCombobox brands={brands} />
            </div>

            {/* Model */}
            <div className="space-y-2">
              <Label htmlFor="model">Model *</Label>
              <Input
                id="model"
                name="model"
                placeholder="e.g. Speedmaster Professional"
                required
                className="h-11"
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category_id">Category *</Label>
              <input type="hidden" name="category_id" value={selectedCategoryId} />
              <Select
                value={selectedCategoryId}
                onValueChange={(val) => setSelectedCategoryId(val ?? "")}
              >
                <SelectTrigger id="category_id" className="h-11">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.length === 0 ? (
                    <SelectItem value="" disabled>
                      No categories — create one in Config first
                    </SelectItem>
                  ) : (
                    categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="w-full"
              size="lg"
            >
              {isPending ? "Saving..." : "Save Watch"}
            </Button>
          </form>
        </div>
      )}
    </div>
  )
}

"use client"

import { useCallback, useEffect, useRef, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import { BrandCombobox } from "@/components/brand-combobox"
import { createWatchWithPhoto } from "@/lib/actions/watch-actions"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type { Brand, Category } from "@/lib/types/watch"

interface AddWatchFlowProps {
  brands: Brand[]
  categories: Category[]
}

const ACCEPT = "image/jpeg,image/png,image/webp,image/heic"

function formatSize(bytes: number): string {
  const mb = bytes / 1024 / 1024
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`
}

/**
 * Downscale a captured/selected image in the browser before upload: caps the
 * long edge at 2000px and re-encodes to JPEG. This keeps phone-camera photos
 * (large HEIC/48MP JPEGs) well under the server-action body limit and the
 * storage size cap, and converts HEIC→JPEG so the thumbnail step works too.
 * Falls back to the original file if the image can't be decoded (e.g. HEIC on
 * a browser that can't render it).
 */
async function downscaleImage(file: File, maxEdge = 2000, quality = 0.85): Promise<File> {
  try {
    const url = URL.createObjectURL(file)
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = reject
      el.src = url
    })
    URL.revokeObjectURL(url)

    const longest = Math.max(img.naturalWidth, img.naturalHeight)
    const scale = longest > maxEdge ? maxEdge / longest : 1
    // Skip work only when it's already a small JPEG.
    if (scale === 1 && file.type === "image/jpeg") return file

    const canvas = document.createElement("canvas")
    canvas.width = Math.round(img.naturalWidth * scale)
    canvas.height = Math.round(img.naturalHeight * scale)
    const ctx = canvas.getContext("2d")
    if (!ctx) return file
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality)
    )
    if (!blob) return file

    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg"
    return new File([blob], name, { type: "image/jpeg" })
  } catch {
    return file
  }
}

export function AddWatchFlow({ brands, categories }: AddWatchFlowProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  // Which CTA was pressed — read by the form action to choose the redirect.
  const destRef = useRef<"edit" | "close">("close")

  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [selectedCategoryId, setSelectedCategoryId] = useState("")
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const attachFile = useCallback(async (f: File | undefined | null) => {
    if (!f) return
    setProcessing(true)
    const prepared = await downscaleImage(f)
    setFile(prepared)
    setPreviewUrl((old) => {
      if (old) URL.revokeObjectURL(old)
      return URL.createObjectURL(prepared)
    })
    setProcessing(false)
  }, [])

  // Let a copied image (e.g. from a web page, for wish-list watches) be pasted
  // anywhere on the page. Only image pastes are intercepted — text pastes into
  // the Brand/Model inputs behave normally.
  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const item = Array.from(e.clipboardData?.items ?? []).find((i) =>
        i.type.startsWith("image/")
      )
      const pasted = item?.getAsFile()
      if (pasted) {
        e.preventDefault()
        attachFile(pasted)
      }
    }
    window.addEventListener("paste", onPaste)
    return () => window.removeEventListener("paste", onPaste)
  }, [attachFile])

  function removeFile() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(null)
    setPreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    attachFile(e.dataTransfer.files?.[0])
  }

  function handleSubmit(formData: FormData) {
    if (file) formData.set("photo", file)
    formData.set("redirect_to", destRef.current)
    setError(null)
    startTransition(async () => {
      try {
        const result = await createWatchWithPhoto(formData)
        // The action returns a destination on success; navigate from the client
        // so we never rely on a throw-based redirect() (which a try/catch eats).
        if (result?.error) {
          setError(result.error)
          toast.error(result.error)
        } else if (result?.redirectTo) {
          router.push(result.redirectTo)
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e)
        setError(`Failed to create watch: ${message}`)
        toast.error(`Failed to create watch: ${message}`)
      }
    })
  }

  return (
    <div>
      <Link
        href="/collection"
        className="inline-flex items-center gap-1.5 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        ‹ Cancel
      </Link>

      <div className="mb-6 mt-3.5">
        <div className="mb-2.5 font-mono text-[11px] tracking-[3px] text-brass">NEW ENTRY</div>
        <h1 className="font-display text-3xl font-semibold leading-[1.05] sm:text-[34px]">
          Add a Watch
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-[14.5px]">
          Just the essentials to file it — brand, model, and a category. Photos, specs &amp;
          dial framing follow on the Edit page.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <form action={handleSubmit}>
        <input type="hidden" name="category_id" value={selectedCategoryId} />
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT}
          onChange={(e) => attachFile(e.target.files?.[0])}
          className="hidden"
        />

        <div className="rounded-2xl border border-l-2 border-border border-l-brass/40 bg-card p-6">
          {/* Photo — optional */}
          <Label className="mb-2.5 block text-xs text-muted-foreground">
            Photo <span className="font-normal text-muted-foreground/70">— optional</span>
          </Label>

          {file ? (
            <div className="flex items-center gap-3.5 rounded-[13px] border border-border bg-white/[0.03] p-3.5">
              <div className="relative h-[60px] w-[60px] shrink-0 overflow-hidden rounded-[10px] border border-border bg-muted">
                {previewUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewUrl} alt="Selected" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm text-foreground">{file.name}</div>
                <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                  {formatSize(file.size)} · will be set as cover
                </div>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={removeFile}>
                Remove
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={cn(
                "flex w-full flex-col items-center gap-2 rounded-[13px] border border-dashed border-border bg-white/[0.02] px-5 py-7 text-center transition-colors hover:border-brass/50 hover:bg-brass/5",
                dragging && "border-brass/60 bg-brass/5"
              )}
            >
              <span className="grid h-11 w-11 place-items-center rounded-[11px] bg-brass/15 text-lg text-brass">
                ⬆
              </span>
              <span className="text-sm text-foreground sm:text-[14.5px]">
                {processing ? (
                  "Optimizing photo…"
                ) : (
                  <>
                    <span className="font-medium text-brass">Browse</span>, drag, or paste a photo here
                  </>
                )}
              </span>
              <span className="font-mono text-[11px] text-muted-foreground">
                JPG, PNG, HEIC or WebP
              </span>
            </button>
          )}

          {/* Brand */}
          <div className="mt-5 space-y-2">
            <Label>
              Brand <span className="text-brass">*</span>
            </Label>
            <BrandCombobox brands={brands} />
          </div>

          {/* Model */}
          <div className="mt-[18px] space-y-2">
            <Label htmlFor="model">
              Model <span className="text-brass">*</span>
            </Label>
            <Input
              id="model"
              name="model"
              placeholder="e.g. C60 Trident Pro 300"
              required
              className="h-11"
            />
          </div>

          {/* Category */}
          <div className="mt-[18px] space-y-2">
            <Label htmlFor="category_id">
              Category <span className="text-brass">*</span>
            </Label>
            <Select
              value={selectedCategoryId}
              onValueChange={(val) => setSelectedCategoryId(val ?? "")}
            >
              <SelectTrigger id="category_id" className="h-11">
                <span className={selectedCategoryId ? "" : "text-muted-foreground"}>
                  {selectedCategoryId
                    ? categories.find((c) => c.id === selectedCategoryId)?.name ?? "Select a category"
                    : "Select a category"}
                </span>
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

          {/* Purchase price — for wish-list entries this is the estimated cost */}
          <div className="mt-[18px] space-y-2">
            <Label htmlFor="purchase_price">
              Purchase price{" "}
              <span className="font-normal text-muted-foreground/70">— optional</span>
            </Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-brass">
                $
              </span>
              <Input
                id="purchase_price"
                name="purchase_price"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                placeholder="e.g. 1250"
                className="h-11 pl-7"
              />
            </div>
            <p className="text-[12px] leading-relaxed text-muted-foreground">
              For wish-list watches, use the estimated cost to buy it.
            </p>
          </div>

          {/* Wish list */}
          <label className="mt-[18px] flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="is_wishlist"
              className="h-4 w-4 rounded border-border accent-brass"
            />
            <span className="font-medium">Wish list</span>
            <span className="text-xs text-muted-foreground">
              — not owned yet; kept out of collection counts
            </span>
          </label>
        </div>

        {/* Two CTAs */}
        <div className="mt-[22px] flex flex-wrap items-center gap-3">
          <Button
            type="submit"
            size="lg"
            disabled={isPending || processing}
            onClick={() => (destRef.current = "edit")}
            className="bg-brass text-[#1a1206] hover:bg-brass/90"
          >
            {isPending ? "Saving…" : "Save & add details →"}
          </Button>
          <Button
            type="submit"
            size="lg"
            variant="outline"
            disabled={isPending || processing}
            onClick={() => (destRef.current = "close")}
          >
            Save & close
          </Button>
        </div>
        <p className="mt-3.5 text-[12.5px] leading-relaxed text-muted-foreground">
          “Save &amp; add details” opens the full Edit page (specs, more photos, dial framing).
          “Save &amp; close” files it and returns to the watch.
        </p>
      </form>
    </div>
  )
}

"use client"

import { useRef, useState, useTransition } from "react"
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
import { PhotoDrop } from "@/components/photo-drop"
import { createWatchWithPhoto } from "@/lib/actions/watch-actions"
import { toast } from "sonner"
import type { Brand, Category } from "@/lib/types/watch"

interface AddWatchFlowProps {
  brands: Brand[]
  categories: Category[]
}

function formatSize(bytes: number): string {
  const mb = bytes / 1024 / 1024
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`
}

export function AddWatchFlow({ brands, categories }: AddWatchFlowProps) {
  const router = useRouter()
  // Which CTA was pressed — read by the form action to choose the redirect.
  const destRef = useRef<"view" | "another">("view")

  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState("")
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  // Bumped after "Save and add another" to remount the form fresh (resets
  // the comboboxes' internal state, which form.reset() can't reach).
  const [formKey, setFormKey] = useState(0)

  // PhotoDrop delivers the file already downscaled (A3).
  function attachFile(f: File | undefined) {
    if (!f) return
    setFile(f)
    setPreviewUrl((old) => {
      if (old) URL.revokeObjectURL(old)
      return URL.createObjectURL(f)
    })
  }

  function removeFile() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(null)
    setPreviewUrl(null)
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
        } else if (result?.redirectTo === "/add") {
          // Batch entry: stay here with a fresh form.
          toast.success("Watch saved — add the next one")
          removeFile()
          setSelectedCategoryId("")
          setFormKey((k) => k + 1)
          router.refresh()
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
        <div className="mb-2.5 font-mono text-2xs tracking-[3px] text-muted-foreground">NEW ENTRY</div>
        <h1 className="font-display text-lg font-semibold tracking-tight">
          Add a Watch
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Just the essentials to file it — brand, model, and a category. Photos, specs &amp;
          dial framing follow on the Edit page.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <form key={formKey} action={handleSubmit}>
        <input type="hidden" name="category_id" value={selectedCategoryId} />

        <div className="rounded-xl border border-border bg-card p-6">
          {/* Photo — optional */}
          <Label className="mb-2.5 block text-xs text-muted-foreground">
            Photo <span className="font-normal text-muted-foreground">— optional</span>
          </Label>

          {file ? (
            <div className="flex items-center gap-3.5 rounded-xl border border-border bg-muted/40 p-3.5">
              <div className="relative h-[60px] w-[60px] shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                {previewUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewUrl} alt="Selected" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm text-foreground">{file.name}</div>
                <div className="mt-0.5 font-mono text-2xs text-muted-foreground">
                  {formatSize(file.size)} · will be set as cover
                </div>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={removeFile}>
                Remove
              </Button>
            </div>
          ) : (
            <PhotoDrop paste onFiles={([f]) => attachFile(f)} disabled={isPending} />
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
              <span className="font-normal text-muted-foreground">— optional</span>
            </Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
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
            <p className="text-xs leading-relaxed text-muted-foreground">
              For wish-list watches, use the estimated cost to buy it.
            </p>
          </div>

          {/* Coming soon */}
          <label className="mt-[18px] flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="is_coming_soon"
              className="h-4 w-4 rounded border-border accent-brass"
            />
            <span className="font-medium">Coming soon</span>
            <span className="text-xs text-muted-foreground">
              — ordered, awaiting arrival
            </span>
          </label>

          {/* Wish list */}
          <label className="mt-2.5 flex items-center gap-2 text-sm">
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

        {/* One primary CTA plus a quiet batch-entry escape (F3). */}
        <div className="mt-[22px] flex flex-wrap items-center gap-3">
          <Button
            type="submit"
            size="lg"
            disabled={isPending}
            onClick={() => (destRef.current = "view")}
            className="bg-brass text-brass-foreground hover:bg-brass/90"
          >
            {isPending ? "Saving…" : "Save watch"}
          </Button>
          <Button
            type="submit"
            size="lg"
            variant="ghost"
            disabled={isPending}
            onClick={() => (destRef.current = "another")}
            className="text-muted-foreground hover:text-foreground"
          >
            Save and add another
          </Button>
        </div>
      </form>
    </div>
  )
}

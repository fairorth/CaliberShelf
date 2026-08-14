"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Info } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { listForSale, updateListing } from "@/lib/actions/sales"
import { listingFormSchema, saleVenueLabels, saleVenueSchema } from "@/lib/validations/sale"
import { formatCurrency, cn } from "@/lib/utils"
import type { SaleVenue, WatchListing } from "@/lib/types/watch"
import { toast } from "sonner"

interface ListForSaleDialogProps {
  watchId: string
  /** "Brand Model" for the subtitle. */
  watchName: string
  referenceNumber: string | null
  /** latest agent estimate, for the live ask helper; null = no estimate. */
  latestMidCents: number | null
  latestLowCents: number | null
  latestHighCents: number | null
  /** present = edit mode, prefilled from the active listing. */
  listing?: WatchListing | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const VENUES = saleVenueSchema.options

function todayLocal(): string {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${d.getFullYear()}-${m}-${day}`
}

/**
 * List for sale (§3.4) / Edit listing. Saving writes the watch_listings row,
 * sets sale_status = 'listed', and copies the ask into target_ask_cents when
 * that is empty — all in the server action.
 */
export function ListForSaleDialog({
  watchId,
  watchName,
  referenceNumber,
  latestMidCents,
  latestLowCents,
  latestHighCents,
  listing,
  open,
  onOpenChange,
}: ListForSaleDialogProps) {
  const router = useRouter()
  const editing = !!listing
  const [venue, setVenue] = useState<SaleVenue>(listing?.venue ?? "watchexchange")
  const [venueOther, setVenueOther] = useState(listing?.venue_other ?? "")
  const [listedAt, setListedAt] = useState(listing?.listed_at ?? todayLocal())
  const [ask, setAsk] = useState(
    listing ? (listing.ask_price_cents / 100).toFixed(2) : ""
  )
  const [url, setUrl] = useState(listing?.listing_url ?? "")
  const [pending, startTransition] = useTransition()

  // Live ask-vs-estimate helper (§3.4). Presentation math, not a gain figure.
  const askCents = ask.trim() === "" ? null : Math.round(parseFloat(ask) * 100)
  const askPct =
    askCents != null && Number.isFinite(askCents) && latestMidCents
      ? ((askCents - latestMidCents) / latestMidCents) * 100
      : null
  const askPosition =
    askCents != null && latestHighCents != null && latestLowCents != null
      ? askCents > latestHighCents
        ? "above the high bound"
        : askCents < latestLowCents
          ? "below the low bound"
          : "inside the range"
      : null

  function submit() {
    const input = {
      venue,
      venue_other: venueOther,
      listing_url: url,
      listed_at: listedAt,
      ask_price: ask,
    }
    const parsed = listingFormSchema.safeParse(input)
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message)
      return
    }
    startTransition(async () => {
      const result = editing
        ? await updateListing(watchId, input)
        : await listForSale(watchId, input)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(editing ? "Listing updated." : "Listed for sale.")
        onOpenChange(false)
        router.refresh()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit listing" : "List for sale"}</DialogTitle>
          <DialogDescription>
            {watchName}
            {referenceNumber ? ` · ${referenceNumber}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>
              Venue <span className="text-brass">*</span>
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {VENUES.map((v) => (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={venue === v}
                  onClick={() => setVenue(v)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs transition-colors",
                    venue === v
                      ? "bg-brass/15 text-brass ring-1 ring-brass/45"
                      : "text-muted-foreground ring-1 ring-border hover:text-foreground"
                  )}
                >
                  {v === "other" ? "Other…" : saleVenueLabels[v]}
                </button>
              ))}
            </div>
            {venue === "other" && (
              <Input
                placeholder="Name the venue"
                value={venueOther}
                onChange={(e) => setVenueOther(e.target.value)}
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="listed_at">
                Listed date <span className="text-brass">*</span>
              </Label>
              <Input
                id="listed_at"
                type="date"
                value={listedAt}
                onChange={(e) => setListedAt(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ask_price">
                Ask price <span className="text-brass">*</span>
              </Label>
              <Input
                id="ask_price"
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g. 4300.00"
                value={ask}
                onChange={(e) => setAsk(e.target.value)}
                className="font-mono tabular-nums"
              />
            </div>
          </div>

          {latestMidCents != null && (
            <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2.5">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <p className="text-xs leading-relaxed text-muted-foreground">
                Latest estimate{" "}
                <span className="font-mono text-foreground">
                  {formatCurrency(latestMidCents, "USD", true)}
                </span>
                {latestLowCents != null && latestHighCents != null && (
                  <>
                    {" "}
                    (range {Math.round(latestLowCents / 100).toLocaleString()}–
                    {Math.round(latestHighCents / 100).toLocaleString()})
                  </>
                )}
                .
                {askPct != null && (
                  <>
                    {" "}
                    Your ask is{" "}
                    <span className="font-mono text-foreground">
                      {Math.abs(askPct).toFixed(1)}%
                    </span>{" "}
                    {askPct >= 0 ? "above" : "below"} mid
                    {askPosition ? ` and ${askPosition}` : ""}.
                  </>
                )}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="listing_url">Listing URL</Label>
            <Input
              id="listing_url"
              type="url"
              placeholder="https://reddit.com/r/Watchexchange/comments/…"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="font-mono text-xs"
            />
          </div>
        </div>

        <DialogFooter className="items-center border-t border-border pt-3.5 sm:justify-between">
          <p className="text-xs text-muted-foreground">
            {editing
              ? "Updates the active listing."
              : "Sets status to Listed. Price checks keep running."}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={submit}
              disabled={pending}
              className="bg-brass text-brass-foreground hover:bg-brass/90"
            >
              {pending ? "Saving…" : editing ? "Save listing" : "List it"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

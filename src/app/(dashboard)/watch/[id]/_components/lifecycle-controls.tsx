"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Handshake, ShoppingBag, Tag } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  markCandidate,
  revertToOwned,
  undoSale,
  withdrawListing,
} from "@/lib/actions/sales"
import { saleVenueLabels } from "@/lib/validations/sale"
import { ListForSaleDialog } from "./list-for-sale-dialog"
import { RecordSaleDialog } from "./record-sale-dialog"
import { formatCurrency, cn } from "@/lib/utils"
import type { SaleStatus, WatchListing, WatchSale } from "@/lib/types/watch"
import { toast } from "sonner"

interface LifecycleControlsProps {
  watchId: string
  watchName: string
  referenceNumber: string | null
  saleStatus: SaleStatus
  candidateSince: string | null
  candidateNote: string | null
  costBasisCents: number
  purchasePriceKnown: boolean
  purchaseDate: string | null
  latestMidCents: number | null
  latestLowCents: number | null
  latestHighCents: number | null
  listing: WatchListing | null
  /** whole days since listed_at, computed server-side (render must stay pure). */
  daysListed: number | null
  sale: WatchSale | null
}

const STEPS: { value: SaleStatus; label: string }[] = [
  { value: "owned", label: "Owned" },
  { value: "candidate", label: "Candidate" },
  { value: "listed", label: "Listed" },
  { value: "sold", label: "Sold" },
]

function formatDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
  })
}

function venueName(venue: WatchListing["venue"], other: string | null): string {
  return venue === "other" ? other || "Other" : saleVenueLabels[venue]
}

/**
 * The LIFECYCLE zone of the Market panel (§3.3): the linear breadcrumb, one
 * primary action reflecting the current status, and the quiet links back.
 * Every mutation goes through the transition-checked actions in
 * lib/actions/sales.ts.
 */
export function LifecycleControls(props: LifecycleControlsProps) {
  const {
    watchId,
    watchName,
    referenceNumber,
    saleStatus,
    candidateSince,
    candidateNote,
    listing,
    sale,
  } = props
  const router = useRouter()
  const [candidateOpen, setCandidateOpen] = useState(false)
  /** Owned watches hide the sale controls until asked (see below). */
  const [sellingOpen, setSellingOpen] = useState(false)
  const [note, setNote] = useState("")
  const [listOpen, setListOpen] = useState(false)
  const [editListingOpen, setEditListingOpen] = useState(false)
  const [saleOpen, setSaleOpen] = useState(false)
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [undoOpen, setUndoOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  function act(fn: () => Promise<{ error?: string; success?: boolean }>, done: string) {
    startTransition(async () => {
      const result = await fn()
      if (result.error) toast.error(result.error)
      else {
        toast.success(done)
        router.refresh()
      }
    })
  }

  const daysListed = props.daysListed
  const askVsMidPct =
    listing && props.latestMidCents
      ? ((listing.ask_price_cents - props.latestMidCents) / props.latestMidCents) * 100
      : null

  // An owned watch is not "in" a sale process, and most never will be. The
  // four-step breadcrumb and two sale buttons were permanent furniture for a
  // path the owner rarely takes — and worse, its first step is also called
  // "Owned", colliding with the Ownership section's own Owned / Coming soon /
  // Wish list. So: nothing but one quiet link until you say you are selling.
  const inSaleFlow = saleStatus !== "owned"

  if (!inSaleFlow && !sellingOpen) {
    return (
      <div className="flex flex-1 items-start">
        <button
          type="button"
          onClick={() => setSellingOpen(true)}
          className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          Thinking of selling this one?
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col items-start gap-2.5">
      <p className="font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground">
        Selling
      </p>

      {/* The linear breadcrumb, shown only once the watch is actually in the
          sale flow — before that it describes four states none of which have
          happened. */}
      {inSaleFlow && (
        <div className="flex items-center gap-2 text-xs">
          {STEPS.map((step, i) => (
            <span key={step.value} className="flex items-center gap-2">
              {i > 0 && <span className="text-muted-foreground/60">→</span>}
              <span
                className={cn(
                  step.value === saleStatus
                    ? "font-medium text-foreground"
                    : "text-muted-foreground/60"
                )}
              >
                {step.label}
              </span>
            </span>
          ))}
        </div>
      )}

      {saleStatus === "owned" && (
        <>
          <Button
            onClick={() => setCandidateOpen(true)}
            className="gap-1.5 bg-brass text-brass-foreground hover:bg-brass/90"
          >
            <Tag className="h-4 w-4" aria-hidden="true" />
            Mark as sale candidate…
          </Button>
          <button
            type="button"
            onClick={() => setListOpen(true)}
            className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            List for sale…
          </button>
          <button
            type="button"
            onClick={() => setSellingOpen(false)}
            className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            Never mind
          </button>
        </>
      )}

      {saleStatus === "candidate" && (
        <>
          <Button
            onClick={() => setListOpen(true)}
            className="gap-1.5 bg-brass text-brass-foreground hover:bg-brass/90"
          >
            <ShoppingBag className="h-4 w-4" aria-hidden="true" />
            List for sale…
          </Button>
          <button
            type="button"
            disabled={pending}
            onClick={() => act(() => revertToOwned(watchId), "Back to owned.")}
            className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            Changed my mind
          </button>
          <p className="text-xs text-muted-foreground">
            Candidate{candidateSince ? ` since ${formatDate(candidateSince)}` : ""}
            {candidateNote ? ` · ${candidateNote}` : ""}
          </p>
        </>
      )}

      {saleStatus === "listed" && listing && (
        <>
          <Button
            onClick={() => setSaleOpen(true)}
            className="gap-1.5 bg-brass text-brass-foreground hover:bg-brass/90"
          >
            <Handshake className="h-4 w-4" aria-hidden="true" />
            Record sale…
          </Button>
          <div className="flex items-center gap-3.5 text-xs">
            <button
              type="button"
              onClick={() => setEditListingOpen(true)}
              className="text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              Edit listing
            </button>
            <button
              type="button"
              onClick={() => setWithdrawOpen(true)}
              className="text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              Withdraw listing
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Listed {formatDate(listing.listed_at)} on{" "}
            {venueName(listing.venue, listing.venue_other)} at{" "}
            {formatCurrency(listing.ask_price_cents, listing.currency, true)}
            {askVsMidPct != null &&
              ` — ${Math.abs(askVsMidPct).toFixed(1)}% ${askVsMidPct >= 0 ? "above" : "below"} the latest mid`}
            .
          </p>
        </>
      )}

      {saleStatus === "sold" && sale && (
        <>
          <p className="text-xs text-muted-foreground">
            Sold {formatDate(sale.sold_at)} on {venueName(sale.venue, sale.venue_other)}
            {sale.buyer_name || sale.buyer_handle
              ? ` to ${sale.buyer_name || sale.buyer_handle}`
              : ""}{" "}
            · net{" "}
            <span className="font-mono tabular-nums text-foreground">
              {formatCurrency(sale.net_proceeds_cents, sale.currency)}
            </span>
          </p>
          <button
            type="button"
            onClick={() => setUndoOpen(true)}
            className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            Undo sale
          </button>
        </>
      )}

      {/* Mark-as-candidate: one optional note, ≤200 chars (§2). */}
      <Dialog open={candidateOpen} onOpenChange={setCandidateOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Mark as sale candidate</DialogTitle>
            <DialogDescription>
              Puts {watchName} on the block — nothing is listed anywhere yet.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="candidate_note">Why it&rsquo;s on the block</Label>
            <Textarea
              id="candidate_note"
              rows={2}
              maxLength={200}
              placeholder="e.g. thinning the dress end"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCandidateOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={pending}
              onClick={() => {
                setCandidateOpen(false)
                act(
                  () => markCandidate(watchId, { candidate_note: note }),
                  "Marked as a sale candidate."
                )
              }}
              className="bg-brass text-brass-foreground hover:bg-brass/90"
            >
              Mark it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Withdraw: listed → candidate | owned (§2). */}
      <AlertDialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Withdraw the listing?</AlertDialogTitle>
            <AlertDialogDescription>
              Closes the listing as withdrawn. The watch can stay on the block
              as a candidate, or go back to plain owned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                act(() => withdrawListing(watchId, "candidate"), "Withdrawn — still a candidate.")
              }
            >
              Keep as candidate
            </AlertDialogAction>
            <AlertDialogAction
              onClick={() =>
                act(() => withdrawListing(watchId, "owned"), "Withdrawn — back to owned.")
              }
            >
              Back to owned
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Undo sale: deletes the sale row, restores Owned (§2, exit checklist). */}
      <AlertDialog open={undoOpen} onOpenChange={setUndoOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Undo this sale?</AlertDialogTitle>
            <AlertDialogDescription>
              Deletes the sale record and returns the watch to Owned. The
              closed listing stays closed, and price checking stays off until
              you re-enable it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => act(() => undoSale(watchId), "Sale undone.")}
            >
              Undo sale
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ListForSaleDialog
        watchId={watchId}
        watchName={watchName}
        referenceNumber={referenceNumber}
        latestMidCents={props.latestMidCents}
        latestLowCents={props.latestLowCents}
        latestHighCents={props.latestHighCents}
        open={listOpen}
        onOpenChange={setListOpen}
      />
      {listing && (
        <ListForSaleDialog
          watchId={watchId}
          watchName={watchName}
          referenceNumber={referenceNumber}
          latestMidCents={props.latestMidCents}
          latestLowCents={props.latestLowCents}
          latestHighCents={props.latestHighCents}
          listing={listing}
          open={editListingOpen}
          onOpenChange={setEditListingOpen}
        />
      )}
      <RecordSaleDialog
        watchId={watchId}
        watchName={watchName}
        listingSummary={
          listing
            ? `listed ${daysListed} day${daysListed === 1 ? "" : "s"} on ${venueName(listing.venue, listing.venue_other)}`
            : null
        }
        costBasisCents={props.costBasisCents}
        purchasePriceKnown={props.purchasePriceKnown}
        purchaseDate={props.purchaseDate}
        open={saleOpen}
        onOpenChange={setSaleOpen}
      />
    </div>
  )
}

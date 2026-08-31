"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ExternalLink, Handshake, Tag } from "lucide-react"
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
import { Button } from "@/components/ui/button"
import { StatusPill } from "@/components/ui/status-pill"
import { undoSale, withdrawListing } from "@/lib/actions/sales"
import { saleVenueLabels } from "@/lib/validations/sale"
import { ListForSaleDialog } from "./list-for-sale-dialog"
import { RecordSaleDialog } from "./record-sale-dialog"
import { EditSaleDialog } from "./edit-sale-dialog"
import { formatCurrency, cn } from "@/lib/utils"
import type { SaleStatus, WatchListing, WatchSale } from "@/lib/types/watch"
import { toast } from "sonner"

interface LifecycleControlsProps {
  watchId: string
  watchName: string
  referenceNumber: string | null
  saleStatus: SaleStatus
  costBasisCents: number
  purchasePriceKnown: boolean
  purchaseDate: string | null
  latestMidCents: number | null
  latestLowCents: number | null
  latestHighCents: number | null
  listing: WatchListing | null
  /** whole days since listed_at, computed server-side (render must stay pure). */
  daysListed: number | null
  /** past LISTING_AGING_DAYS. Decided server-side: the threshold lives in
   *  queries/sales.ts, which is server-only — importing it here would drag
   *  the Supabase server client into the browser bundle. */
  listingAging: boolean
  sale: WatchSale | null
}

/** The lifecycle is linear and three steps deep since 00051 retired Candidate. */
const STEPS: { value: SaleStatus; label: string }[] = [
  { value: "owned", label: "Owned" },
  { value: "listed", label: "For sale" },
  { value: "sold", label: "Sold" },
]

function formatDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function venueName(venue: WatchListing["venue"], other: string | null): string {
  return venue === "other" ? other || "Other" : saleVenueLabels[venue]
}

const EYEBROW = "font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground"

/** One label/value pair in the sale record grid. */
function SaleFact({
  label,
  mono,
  children,
}: {
  label: string
  mono?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className={EYEBROW}>{label}</dt>
      <dd className={cn("text-xs text-foreground", mono && "font-mono tabular-nums")}>
        {children}
      </dd>
    </div>
  )
}

/**
 * The SALE zone of the Market panel: the linear breadcrumb, the one primary
 * action for the current status, the sale record itself, and the quiet ways
 * back. Every mutation goes through the transition-checked actions in
 * lib/actions/sales.ts.
 *
 * An owned watch shows nothing but one link — most watches never enter this
 * flow, and a permanent three-step breadcrumb for a path you are not on is
 * furniture.
 */
export function LifecycleControls(props: LifecycleControlsProps) {
  const { watchId, watchName, referenceNumber, saleStatus, listing, sale } = props
  const router = useRouter()
  /** Owned watches hide the sale controls until asked. */
  const [sellingOpen, setSellingOpen] = useState(false)
  const [listOpen, setListOpen] = useState(false)
  const [editListingOpen, setEditListingOpen] = useState(false)
  const [saleOpen, setSaleOpen] = useState(false)
  const [editSaleOpen, setEditSaleOpen] = useState(false)
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

  const inSaleFlow = saleStatus !== "owned"

  if (!inSaleFlow && !sellingOpen) {
    return (
      <div className="flex flex-col gap-1">
        <p className={EYEBROW}>Sale</p>
        <button
          type="button"
          onClick={() => setSellingOpen(true)}
          className="self-start text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          Thinking of selling this one?
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-start gap-2.5">
      <p className={EYEBROW}>Sale</p>

      {inSaleFlow && (
        <div className="flex items-center gap-2 text-xs">
          {STEPS.map((step, i) => (
            <span key={step.value} className="flex items-center gap-2">
              {i > 0 && <span className="text-muted-foreground/60">&rarr;</span>}
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
          {/* One button now that Candidate is gone: putting a watch up for
              sale means saying where, when and for how much. */}
          <Button
            onClick={() => setListOpen(true)}
            className="gap-1.5 bg-brass text-brass-foreground hover:bg-brass/90"
          >
            <Tag className="h-4 w-4" aria-hidden="true" />
            Mark for sale&hellip;
          </Button>
          <button
            type="button"
            onClick={() => setSellingOpen(false)}
            className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            Never mind
          </button>
        </>
      )}

      {saleStatus === "listed" && listing && (
        <>
          {/* The sale record while it is open: where, when, how much, how
              long. The same four facts the Watch Sales report lists. */}
          <dl className="grid w-full max-w-md grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
            <SaleFact label="Where">
              {listing.listing_url ? (
                <a
                  href={listing.listing_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 underline-offset-2 hover:underline"
                >
                  {venueName(listing.venue, listing.venue_other)}
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              ) : (
                venueName(listing.venue, listing.venue_other)
              )}
            </SaleFact>
            <SaleFact label="Listed">{formatDate(listing.listed_at)}</SaleFact>
            <SaleFact label="Asking" mono>
              {formatCurrency(listing.ask_price_cents, listing.currency, true)}
            </SaleFact>
            <SaleFact label="On market">
              <span className="flex items-center gap-2">
                <span className="font-mono tabular-nums">
                  {daysListed} day{daysListed === 1 ? "" : "s"}
                </span>
                {props.listingAging && <StatusPill tone="warning">Aging</StatusPill>}
              </span>
            </SaleFact>
          </dl>
          {askVsMidPct != null && (
            <p className="text-xs text-muted-foreground">
              Asking {Math.abs(askVsMidPct).toFixed(1)}%{" "}
              {askVsMidPct >= 0 ? "above" : "below"} the latest estimate.
            </p>
          )}
          <Button
            onClick={() => setSaleOpen(true)}
            className="gap-1.5 bg-brass text-brass-foreground hover:bg-brass/90"
          >
            <Handshake className="h-4 w-4" aria-hidden="true" />
            Record sale&hellip;
          </Button>
          <div className="flex items-center gap-3.5 text-xs">
            <button
              type="button"
              onClick={() => setEditListingOpen(true)}
              className="text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              Edit sale details
            </button>
            <button
              type="button"
              onClick={() => setWithdrawOpen(true)}
              className="text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              No longer for sale
            </button>
          </div>
        </>
      )}

      {saleStatus === "sold" && sale && (
        <>
          <dl className="grid w-full max-w-md grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
            <SaleFact label="Sold">{formatDate(sale.sold_at)}</SaleFact>
            <SaleFact label="Where">{venueName(sale.venue, sale.venue_other)}</SaleFact>
            <SaleFact label="Price" mono>
              {formatCurrency(sale.sale_price_cents, sale.currency, true)}
            </SaleFact>
            <SaleFact label="Net proceeds" mono>
              {formatCurrency(sale.net_proceeds_cents, sale.currency)}
            </SaleFact>
            {(sale.buyer_name || sale.buyer_handle) && (
              <SaleFact label="Buyer">{sale.buyer_name || sale.buyer_handle}</SaleFact>
            )}
            {sale.payment_method && (
              <SaleFact label="Paid by">{sale.payment_method}</SaleFact>
            )}
          </dl>
          <div className="flex items-center gap-3.5 text-xs">
            <button
              type="button"
              onClick={() => setEditSaleOpen(true)}
              className="text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              Edit sale
            </button>
            <button
              type="button"
              onClick={() => setUndoOpen(true)}
              className="text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              Undo sale
            </button>
          </div>
        </>
      )}

      {/* Withdraw: listed -> owned. There is nowhere else to land now. */}
      <AlertDialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Take it off the market?</AlertDialogTitle>
            <AlertDialogDescription>
              Closes the sale as withdrawn and returns {watchName} to plain owned.
              The record stays &mdash; days on market and the asking price are kept
              for next time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={pending}
              onClick={() => act(() => withdrawListing(watchId), "No longer for sale.")}
            >
              Take it off the market
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Undo sale: deletes the sale row, restores Owned. */}
      <AlertDialog open={undoOpen} onOpenChange={setUndoOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Undo this sale?</AlertDialogTitle>
            <AlertDialogDescription>
              Deletes the sale record and returns the watch to Owned. To fix a
              price, a fee or a date, use Edit sale instead &mdash; this throws the
              record away. Price checking stays off until you re-enable it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={pending}
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
      {sale && (
        <EditSaleDialog
          watchId={watchId}
          watchName={watchName}
          sale={sale}
          costBasisCents={props.costBasisCents}
          purchasePriceKnown={props.purchasePriceKnown}
          purchaseDate={props.purchaseDate}
          open={editSaleOpen}
          onOpenChange={setEditSaleOpen}
        />
      )}
    </div>
  )
}

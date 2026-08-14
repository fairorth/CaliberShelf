"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
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
import { Textarea } from "@/components/ui/textarea"
import { recordSale } from "@/lib/actions/sales"
import { saleFormSchema } from "@/lib/validations/sale"
import { saleLedgerPreview } from "@/lib/queries/gain"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface RecordSaleDialogProps {
  watchId: string
  watchName: string
  /** "listed 14 days on r/WatchExchange" — built by the caller. */
  listingSummary: string | null
  costBasisCents: number
  purchasePriceKnown: boolean
  purchaseDate: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function todayLocal(): string {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${d.getFullYear()}-${m}-${day}`
}

const cents = (v: string): number => {
  const n = parseFloat(v)
  return Number.isFinite(n) ? Math.round(n * 100) : 0
}

/** "2y 3m" / "11m" / "18d" — the mock's hold-period format. */
function holdLabel(from: string | null, to: string): string | null {
  if (!from) return null
  const days = Math.floor((Date.parse(to) - Date.parse(from)) / 86_400_000)
  if (!Number.isFinite(days) || days < 0) return null
  if (days < 31) return `${days}d`
  const months = Math.floor(days / 30.44)
  if (months < 12) return `${months}m`
  const years = Math.floor(months / 12)
  const rem = months % 12
  return rem > 0 ? `${years}y ${rem}m` : `${years}y`
}

const money = (c: number) =>
  (c / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/**
 * Record sale (§3.5). The right-hand ledger recomputes as you type via
 * saleLedgerPreview (the shared gain module) — the stored generated column
 * becomes the authority once saved. Venue copies from the active listing in
 * the server action.
 */
export function RecordSaleDialog({
  watchId,
  watchName,
  listingSummary,
  costBasisCents,
  purchasePriceKnown,
  purchaseDate,
  open,
  onOpenChange,
}: RecordSaleDialogProps) {
  const router = useRouter()
  const [soldAt, setSoldAt] = useState(todayLocal())
  const [salePrice, setSalePrice] = useState("")
  const [buyerName, setBuyerName] = useState("")
  const [buyerHandle, setBuyerHandle] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("")
  const [trackingNumber, setTrackingNumber] = useState("")
  const [venueFee, setVenueFee] = useState("")
  const [processingFee, setProcessingFee] = useState("")
  const [shippingCost, setShippingCost] = useState("")
  const [insurance, setInsurance] = useState("")
  const [notes, setNotes] = useState("")
  const [pending, startTransition] = useTransition()

  const ledger = saleLedgerPreview(
    {
      salePriceCents: cents(salePrice),
      venueFeeCents: cents(venueFee),
      processingFeeCents: cents(processingFee),
      shippingCostCents: cents(shippingCost),
      insuranceCents: cents(insurance),
    },
    {
      cost_basis_cents: costBasisCents,
      purchase_price_cents: purchasePriceKnown ? costBasisCents : null,
    }
  )
  const held = holdLabel(purchaseDate, soldAt)

  function submit() {
    const input = {
      sold_at: soldAt,
      sale_price: salePrice,
      buyer_name: buyerName,
      buyer_handle: buyerHandle,
      payment_method: paymentMethod,
      tracking_number: trackingNumber,
      venue_fee: venueFee,
      processing_fee: processingFee,
      shipping_cost: shippingCost,
      insurance,
      notes,
    }
    const parsed = saleFormSchema.safeParse(input)
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message)
      return
    }
    startTransition(async () => {
      const result = await recordSale(watchId, input)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Sale recorded.")
        onOpenChange(false)
        router.refresh()
      }
    })
  }

  const fieldPairs: Array<
    [string, string, (v: string) => void, string, { mono?: boolean; placeholder?: string }][]
  > = [
    [
      ["Buyer name", buyerName, setBuyerName, "buyer_name", { placeholder: "Dan K." }],
      ["Buyer handle", buyerHandle, setBuyerHandle, "buyer_handle", { mono: true, placeholder: "u/handle" }],
    ],
    [
      ["Payment method", paymentMethod, setPaymentMethod, "payment_method", { placeholder: "PayPal G&S, Zelle, cash…" }],
      ["Tracking number", trackingNumber, setTrackingNumber, "tracking_number", { mono: true, placeholder: "" }],
    ],
    [
      ["Venue fee", venueFee, setVenueFee, "venue_fee", { mono: true, placeholder: "0.00" }],
      ["Processing fee", processingFee, setProcessingFee, "processing_fee", { mono: true, placeholder: "0.00" }],
    ],
    [
      ["Shipping", shippingCost, setShippingCost, "shipping_cost", { mono: true, placeholder: "0.00" }],
      ["Insurance", insurance, setInsurance, "insurance", { mono: true, placeholder: "0.00" }],
    ],
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Record sale</DialogTitle>
          <DialogDescription>
            {watchName}
            {listingSummary ? ` · ${listingSummary}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          {/* Left: the sale facts */}
          <div className="min-w-0 flex-1 space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="sold_at">
                  Sold date <span className="text-brass">*</span>
                </Label>
                <Input
                  id="sold_at"
                  type="date"
                  value={soldAt}
                  onChange={(e) => setSoldAt(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sale_price">
                  Sale price <span className="text-brass">*</span>
                </Label>
                <Input
                  id="sale_price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g. 4150.00"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  className="font-mono tabular-nums"
                />
              </div>
            </div>

            {fieldPairs.map((pair, i) => (
              <div key={i} className="grid grid-cols-2 gap-3">
                {pair.map(([label, value, set, id, opts]) => (
                  <div key={id} className="space-y-1.5">
                    <Label htmlFor={id}>{label}</Label>
                    <Input
                      id={id}
                      type={opts.mono && opts.placeholder === "0.00" ? "number" : "text"}
                      step={opts.placeholder === "0.00" ? "0.01" : undefined}
                      min={opts.placeholder === "0.00" ? "0" : undefined}
                      placeholder={opts.placeholder}
                      value={value}
                      onChange={(e) => set(e.target.value)}
                      className={cn(opts.mono && "font-mono tabular-nums text-xs")}
                    />
                  </div>
                ))}
              </div>
            ))}

            <div className="space-y-1.5">
              <Label htmlFor="sale_notes">Notes</Label>
              <Textarea
                id="sale_notes"
                rows={2}
                placeholder="Anything worth remembering about the deal…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Right: the net-proceeds ledger, live */}
          <div className="w-full shrink-0 space-y-2.5 rounded-xl border border-border bg-muted/40 p-4 sm:w-[240px]">
            <p className="font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground">
              Net proceeds
            </p>
            <div className="space-y-1.5 font-mono text-xs tabular-nums">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sale price</span>
                <span className="text-foreground">{money(ledger.salePriceCents)}</span>
              </div>
              {(
                [
                  ["Venue fee", venueFee],
                  ["Processing", processingFee],
                  ["Shipping", shippingCost],
                  ["Insurance", insurance],
                ] as const
              ).map(([label, v]) => (
                <div key={label} className="flex justify-between text-muted-foreground">
                  <span>{label}</span>
                  <span>− {money(cents(v))}</span>
                </div>
              ))}
            </div>
            <div className="h-px bg-border" aria-hidden="true" />
            <div className="flex items-baseline justify-between font-mono tabular-nums">
              <span className="text-xs text-muted-foreground">Net</span>
              <span className="text-md text-foreground">{money(ledger.netProceedsCents)}</span>
            </div>
            <div className="flex justify-between font-mono text-xs tabular-nums text-muted-foreground">
              <span>Cost basis</span>
              <span>{money(ledger.costBasisCents)}</span>
            </div>
            <div className="h-px bg-border" aria-hidden="true" />
            <div className="space-y-0.5">
              <p className="font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground">
                Realized gain
              </p>
              {ledger.gain ? (
                <>
                  <p
                    className={cn(
                      "font-mono text-lg tabular-nums",
                      ledger.gain.cents >= 0 ? "text-chart-2" : "text-destructive"
                    )}
                  >
                    {ledger.gain.cents >= 0 ? "+" : "−"}
                    {money(Math.abs(ledger.gain.cents))}
                  </p>
                  <p
                    className={cn(
                      "font-mono text-xs tabular-nums",
                      ledger.gain.cents >= 0 ? "text-chart-2" : "text-destructive"
                    )}
                  >
                    {ledger.gain.pct != null &&
                      `${ledger.gain.cents >= 0 ? "+" : "−"}${Math.abs(ledger.gain.pct).toFixed(1)}%`}
                    {held ? `${ledger.gain.pct != null ? " · " : ""}held ${held}` : ""}
                  </p>
                </>
              ) : (
                <p
                  className="font-mono text-lg tabular-nums text-muted-foreground"
                  title="No purchase price recorded — gain can't be computed."
                >
                  —
                </p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="items-center border-t border-border pt-3.5 sm:justify-between">
          <p className="max-w-[340px] text-xs text-muted-foreground">
            Marks the watch Sold, closes the listing, and turns price checking
            off so the agent stops spending on a watch you no longer own.
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
              {pending ? "Saving…" : "Record sale"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

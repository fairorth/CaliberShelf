import { z } from "zod"

// Phase 5 sale-lifecycle schemas. Money fields take dollar strings from the
// dialogs and stay dollars here — the server actions convert to BIGINT cents
// via dollarsToCents, matching the watch form's convention.

// 'candidate' was retired in 00051 — the lifecycle is owned → listed → sold.
export const saleStatusSchema = z.enum(["owned", "listed", "sold"])

export const saleVenueSchema = z.enum([
  "watchexchange",
  "redbar_austin",
  "ebay",
  "chrono24",
  "forum",
  "local",
  "other",
])

// Display labels — the segmented control in the List-for-sale dialog (§3.4)
export const saleVenueLabels: Record<string, string> = {
  watchexchange: "r/WatchExchange",
  redbar_austin: "RedBar Austin",
  ebay: "eBay",
  chrono24: "Chrono24",
  forum: "Forum",
  local: "Local",
  other: "Other",
}

const dateString = z
  .string()
  .min(1, "Date is required")
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")

/** Dollar-string input, required, non-negative. */
const requiredDollars = z
  .string()
  .min(1, "Amount is required")
  .transform((val) => parseFloat(val))
  .pipe(z.number().min(0, "Must be zero or more").finite())

/** Dollar-string input, empty = 0 (the fee fields in Record sale). */
const feeDollars = z
  .string()
  .optional()
  .default("")
  .transform((val) => (val.trim() === "" ? 0 : parseFloat(val)))
  .pipe(z.number().min(0, "Must be zero or more").finite())

// ── Mark for sale (§3.4) ────────────────────────────────────────
// The single entry point into the sale flow now that Candidate is gone: to
// put a watch up you say where, when and for how much.

export const listingFormSchema = z
  .object({
    venue: saleVenueSchema,
    venue_other: z.string().optional().default(""),
    listing_url: z
      .string()
      .optional()
      .default("")
      .refine((v) => v === "" || /^https?:\/\//.test(v), {
        message: "Must be a full URL (https://…)",
      }),
    listed_at: dateString,
    ask_price: requiredDollars,
  })
  .refine((data) => data.venue !== "other" || data.venue_other.trim() !== "", {
    message: "Name the venue",
    path: ["venue_other"],
  })

export type ListingFormValues = z.input<typeof listingFormSchema>
export type ListingFormParsed = z.output<typeof listingFormSchema>

// ── Record sale (§3.5) ──────────────────────────────────────────
// Venue is not a field here — it copies from the active listing in the
// action (sales outlive listings via the denormalized column).

export const saleFormSchema = z.object({
  sold_at: dateString,
  sale_price: requiredDollars,
  buyer_name: z.string().optional().default(""),
  buyer_handle: z.string().optional().default(""),
  payment_method: z.string().optional().default(""),
  tracking_number: z.string().optional().default(""),
  venue_fee: feeDollars,
  processing_fee: feeDollars,
  shipping_cost: feeDollars,
  insurance: feeDollars,
  notes: z.string().optional().default(""),
})

export type SaleFormValues = z.input<typeof saleFormSchema>
export type SaleFormParsed = z.output<typeof saleFormSchema>

// ── Edit a recorded sale ────────────────────────────────────────
// Same fields as recording one, plus the venue: a sale outlives its listing,
// so once it exists the venue has to be editable here or it is frozen at
// whatever the listing said. Correcting a fee or a sold date must not mean
// undoing the sale and re-entering it, which is what the old flow required.

export const saleEditSchema = saleFormSchema
  .extend({
    venue: saleVenueSchema,
    venue_other: z.string().optional().default(""),
  })
  .refine((data) => data.venue !== "other" || data.venue_other.trim() !== "", {
    message: "Name the venue",
    path: ["venue_other"],
  })

export type SaleEditValues = z.input<typeof saleEditSchema>
export type SaleEditParsed = z.output<typeof saleEditSchema>

// ── Log a value (manual valuation, V7 / 00046) ──────────────────
// Manual rows require mid value, confidence and a note; agent_model stays
// null and datapoints/sources stay null.

export const manualValuationSchema = z.object({
  value_mid: requiredDollars.refine((v) => v > 0, {
    message: "Value must be more than zero",
  }),
  confidence: z.enum(["high", "medium", "low"]),
  entered_note: z
    .string()
    .min(1, "Say where the number came from")
    .max(500, "Keep the note under 500 characters"),
})

export type ManualValuationValues = z.input<typeof manualValuationSchema>
export type ManualValuationParsed = z.output<typeof manualValuationSchema>

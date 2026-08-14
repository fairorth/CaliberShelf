import { z } from "zod"

// Phase 5 sale-lifecycle schemas. Money fields take dollar strings from the
// dialogs and stay dollars here — the server actions convert to BIGINT cents
// via dollarsToCents, matching the watch form's convention.

export const saleStatusSchema = z.enum(["owned", "candidate", "listed", "sold"])

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

// ── Mark as sale candidate ──────────────────────────────────────

export const markCandidateSchema = z.object({
  candidate_note: z
    .string()
    .max(200, "Keep the note under 200 characters")
    .optional()
    .default(""),
})

export type MarkCandidateValues = z.input<typeof markCandidateSchema>
export type MarkCandidateParsed = z.output<typeof markCandidateSchema>

// ── List for sale (§3.4) ────────────────────────────────────────

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

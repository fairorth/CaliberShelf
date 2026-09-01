import { z } from "zod"

// Enum schemas matching Postgres enums
export const caseMaterialSchema = z.enum([
  "stainless_steel",
  "titanium",
  "gold",
  "rose_gold",
  "white_gold",
  "platinum",
  "ceramic",
  "carbon",
  "bronze",
  "other",
])

export const crystalTypeSchema = z.enum([
  "sapphire",
  "mineral",
  "acrylic",
  "hesalite",
  "other",
])

export const caseShapeSchema = z.enum([
  "round",
  "cushion",
  "tonneau",
  "rectangular",
  "square",
  "oval",
  "octagonal",
  "other",
])

/** How attached the owner is to a watch (00051, 'none' added in 00052).
 *  Ordered strongest-first — the segmented control, the table's sort and the
 *  report all read this array, so the order lives here and nowhere else.
 *  'none' is a deliberate rating ("considered it, feel nothing" — the
 *  clearest sell signal); NULL remains "never rated". */
export const ATTACHMENT_LEVELS = ["max", "high", "medium", "low", "none"] as const

export const attachmentSchema = z.enum(ATTACHMENT_LEVELS)

// Main watch form schema — validates user input for create/update
export const watchFormSchema = z.object({
  // Required FK fields
  brand_id: z.string().min(1, "Brand is required"),
  model: z.string().min(1, "Model is required"),
  category_id: z.string().min(1, "Category is required"),

  // Optional FK
  movement_id: z.string().optional().default(""),

  // Labels — comma-separated IDs from hidden input
  label_ids: z
    .string()
    .optional()
    .default("")
    .transform((val) => (val ? val.split(",").filter(Boolean) : [])),

  // Optional text fields
  reference_number: z.string().optional().default(""),
  serial_number: z.string().optional().default(""),
  nickname: z.string().optional().default(""),
  dial_color: z.string().optional().default(""),
  complication: z.string().optional().default(""),
  notes: z.string().optional().default(""),
  // Storage location — which watch case/box holds it
  box: z.string().optional().default(""),
  // How attached you are (00051). "" = unrated, same empty-string-as-null
  // convention the other optional selects use.
  attachment: z.union([attachmentSchema, z.literal("")]).optional().default(""),

  // Agent-supplied reference awaiting human verification (hidden input "on"/"")
  reference_unverified: z
    .string()
    .optional()
    .transform((v) => v === "on"),

  // Status — checkbox sends "on" when checked, nothing when unchecked
  is_coming_soon: z
    .string()
    .optional()
    .transform((v) => v === "on"),
  is_wishlist: z
    .string()
    .optional()
    .transform((v) => v === "on"),
  // Opt-in to the automated market-valuation agent. Requires a reference
  // number (cross-field rule enforced via .refine below the object).
  price_check_enabled: z
    .string()
    .optional()
    .transform((v) => v === "on"),

  // Optional enum fields (empty string = null in the database)
  case_material: z.union([caseMaterialSchema, z.literal("")]).optional().default(""),
  crystal: z.union([crystalTypeSchema, z.literal("")]).optional().default(""),
  case_shape: z.union([caseShapeSchema, z.literal("")]).optional().default(""),

  // Rotating bezel — replaces the old bezel type/material fields
  rotating_bezel: z
    .string()
    .optional()
    .transform((v) => v === "on"),

  // Optional numeric fields
  case_diameter_mm: z
    .string()
    .optional()
    .default("")
    .transform((val) => (val === "" ? null : parseFloat(val)))
    .pipe(z.number().min(10).max(60).nullable()),
  strap_width_mm: z
    .string()
    .optional()
    .default("")
    .transform((val) => (val === "" ? null : parseFloat(val)))
    .pipe(z.number().min(6).max(30).nullable()),
  lug_to_lug_mm: z
    .string()
    .optional()
    .default("")
    .transform((val) => (val === "" ? null : parseFloat(val)))
    .pipe(z.number().min(20).max(80).nullable()),
  case_height_mm: z
    .string()
    .optional()
    .default("")
    .transform((val) => (val === "" ? null : parseFloat(val)))
    .pipe(z.number().min(4).max(25).nullable()),
  water_resistance_m: z
    .string()
    .optional()
    .default("")
    .transform((val) => (val === "" ? null : parseInt(val, 10)))
    .pipe(z.number().min(0).max(12000).nullable()),
  weight_g: z
    .string()
    .optional()
    .default("")
    .transform((val) => (val === "" ? null : parseFloat(val)))
    .pipe(z.number().min(5).max(1000).nullable()),

  // Purchase info
  purchase_date: z.string().optional().default(""),
  purchase_price: z
    .string()
    .optional()
    .default("")
    .transform((val) => (val === "" ? null : parseFloat(val)))
    .pipe(z.number().min(0).nullable()),
  purchase_currency: z.string().min(3).max(3).default("USD"),

  // Acquisition costs (00043) — cost basis = purchase + these three. The DB
  // derives cost_basis_cents in a generated column; these are inputs only.
  acq_shipping: z
    .string()
    .optional()
    .default("")
    .transform((val) => (val === "" ? null : parseFloat(val)))
    .pipe(z.number().min(0).nullable()),
  acq_tax: z
    .string()
    .optional()
    .default("")
    .transform((val) => (val === "" ? null : parseFloat(val)))
    .pipe(z.number().min(0).nullable()),
  acq_duty: z
    .string()
    .optional()
    .default("")
    .transform((val) => (val === "" ? null : parseFloat(val)))
    .pipe(z.number().min(0).nullable()),

  // Target ask (V10) — the number the market has to cross.
  target_ask: z
    .string()
    .optional()
    .default("")
    .transform((val) => (val === "" ? null : parseFloat(val)))
    .pipe(z.number().min(0).nullable()),
}).refine(
  // Status is exactly one of owned / coming soon / wish list (C3): the form's
  // segmented control guarantees it, and the schema enforces it server-side.
  (data) => !(data.is_coming_soon && data.is_wishlist),
  {
    message: "A watch cannot be both coming soon and on the wish list.",
  }
).refine(
  (data) => !data.price_check_enabled || data.reference_number.trim() !== "",
  {
    message: "Price checking requires a reference number.",
    path: ["price_check_enabled"],
  }
)

export type WatchFormValues = z.input<typeof watchFormSchema>
export type WatchFormParsed = z.output<typeof watchFormSchema>

// The dial-framing schema is gone with the editor (Phase 9 §1). The COLUMNS
// remain in the database and existing values are untouched — nothing writes
// them any more, and square tiles now pick the frame nearest 1:1 instead of
// asking the user to aim a crosshair 121 times.

// Minimal schema for the camera-first "Add Watch" mobile flow
export const quickAddSchema = z.object({
  brand_id: z.string().min(1, "Brand is required"),
  model: z.string().min(1, "Model is required"),
  category_id: z.string().min(1, "Category is required"),
  // For wish-list entries this is the estimated future purchase price.
  purchase_price: z
    .string()
    .optional()
    .default("")
    .transform((val) => (val === "" ? null : parseFloat(val)))
    .pipe(z.number().min(0).nullable()),
  is_coming_soon: z
    .string()
    .optional()
    .transform((v) => v === "on"),
  is_wishlist: z
    .string()
    .optional()
    .transform((v) => v === "on"),
})

// Display labels for enum values
export const caseMaterialLabels: Record<string, string> = {
  stainless_steel: "Stainless Steel",
  titanium: "Titanium",
  gold: "Gold (Yellow)",
  rose_gold: "Rose Gold",
  white_gold: "White Gold",
  platinum: "Platinum",
  ceramic: "Ceramic",
  carbon: "Carbon",
  bronze: "Bronze",
  other: "Other",
}

export const crystalLabels: Record<string, string> = {
  sapphire: "Sapphire",
  mineral: "Mineral",
  acrylic: "Acrylic",
  hesalite: "Hesalite",
  other: "Other",
}

export const caseShapeLabels: Record<string, string> = {
  round: "Round",
  cushion: "Cushion",
  tonneau: "Tonneau",
  rectangular: "Rectangular",
  square: "Square",
  oval: "Oval",
  octagonal: "Octagonal",
  other: "Other",
}

export const attachmentLabels: Record<string, string> = {
  max: "Max",
  high: "High",
  medium: "Medium",
  low: "Low",
  none: "None",
}

export const KNOWN_COMPLICATIONS = [
  "Date",
  "Day",
  "DTZ",
  "Power Reserve",
  "Annual Calendar",
  "Perpetual Calendar",
  "Moon Phase",
  "Fancy",
] as const

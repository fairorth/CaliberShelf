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

export const bezelTypeSchema = z.enum([
  "none",
  "fixed",
  "dive",
  "gmt",
  "tachymeter",
  "compass",
  "countdown",
  "internal",
  "other",
])

export const bezelMaterialSchema = z.enum([
  "stainless_steel",
  "titanium",
  "ceramic",
  "aluminum",
  "sapphire",
  "gold",
  "bronze",
  "carbon",
  "other",
])

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
  bezel_type: z.union([bezelTypeSchema, z.literal("")]).optional().default(""),
  bezel_material: z.union([bezelMaterialSchema, z.literal("")]).optional().default(""),

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
}).refine(
  (data) => !data.price_check_enabled || data.reference_number.trim() !== "",
  {
    message: "Price checking requires a reference number.",
    path: ["price_check_enabled"],
  }
)

export type WatchFormValues = z.input<typeof watchFormSchema>
export type WatchFormParsed = z.output<typeof watchFormSchema>

// Dial framing — focal point (% within cover photo) + zoom for the home-page dial marker
export const dialFramingSchema = z.object({
  dial_focal_x: z.number().min(0).max(100),
  dial_focal_y: z.number().min(0).max(100),
  dial_zoom: z.number().min(1).max(4),
})

export type DialFramingValues = z.infer<typeof dialFramingSchema>

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

export const bezelTypeLabels: Record<string, string> = {
  none: "None",
  fixed: "Fixed",
  dive: "Dive (count-up)",
  gmt: "GMT",
  tachymeter: "Tachymeter",
  compass: "Compass",
  countdown: "Countdown",
  internal: "Internal",
  other: "Other",
}

export const bezelMaterialLabels: Record<string, string> = {
  stainless_steel: "Stainless Steel",
  titanium: "Titanium",
  ceramic: "Ceramic",
  aluminum: "Aluminum",
  sapphire: "Sapphire",
  gold: "Gold",
  bronze: "Bronze",
  carbon: "Carbon",
  other: "Other",
}

export const KNOWN_COMPLICATIONS = [
  "Date",
  "Day",
  "Chronograph",
  "Moon Phase",
  "Power Reserve",
] as const

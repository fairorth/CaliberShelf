import { z } from "zod"

// Enum schemas matching Postgres enums
export const movementTypeSchema = z.enum([
  "automatic",
  "manual_wind",
  "quartz",
  "solar",
  "spring_drive",
  "smartwatch",
  "other",
])

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

export const watchConditionSchema = z.enum([
  "new",
  "like_new",
  "excellent",
  "very_good",
  "good",
  "fair",
  "poor",
])

// Main watch form schema — validates user input for create/update
export const watchFormSchema = z.object({
  // Required FK fields
  brand_id: z.string().min(1, "Brand is required"),
  model: z.string().min(1, "Model is required"),
  case_id: z.string().min(1, "Display case is required"),
  case_slot: z
    .string()
    .min(1, "Case slot is required")
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(0)),

  // Optional FK
  movement_id: z.string().optional().default(""),

  // Optional text fields
  reference_number: z.string().optional().default(""),
  serial_number: z.string().optional().default(""),
  nickname: z.string().optional().default(""),
  dial_color: z.string().optional().default(""),
  complication: z.string().optional().default(""),
  notes: z.string().optional().default(""),

  // Optional enum fields (empty string = null in the database)
  case_material: z.union([caseMaterialSchema, z.literal("")]).optional().default(""),
  crystal: z.union([crystalTypeSchema, z.literal("")]).optional().default(""),
  condition: z.union([watchConditionSchema, z.literal("")]).optional().default(""),

  // Optional numeric fields
  case_diameter_mm: z
    .string()
    .optional()
    .default("")
    .transform((val) => (val === "" ? null : parseFloat(val)))
    .pipe(z.number().min(10).max(60).nullable()),
  water_resistance_m: z
    .string()
    .optional()
    .default("")
    .transform((val) => (val === "" ? null : parseInt(val, 10)))
    .pipe(z.number().min(0).max(12000).nullable()),

  // Purchase info
  purchase_date: z.string().optional().default(""),
  purchase_price: z
    .string()
    .optional()
    .default("")
    .transform((val) => (val === "" ? null : parseFloat(val)))
    .pipe(z.number().min(0).nullable()),
  purchase_currency: z.string().min(3).max(3).default("USD"),
})

export type WatchFormValues = z.input<typeof watchFormSchema>
export type WatchFormParsed = z.output<typeof watchFormSchema>

// Display labels for enum values
export const movementLabels: Record<string, string> = {
  automatic: "Automatic",
  manual_wind: "Manual Wind",
  quartz: "Quartz",
  solar: "Solar",
  spring_drive: "Spring Drive",
  smartwatch: "Smartwatch",
  other: "Other",
}

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

export const conditionLabels: Record<string, string> = {
  new: "New / Unworn",
  like_new: "Like New",
  excellent: "Excellent",
  very_good: "Very Good",
  good: "Good",
  fair: "Fair",
  poor: "Poor",
}

import { z } from "zod"

// Strap/bracelet materials — fixed set (like KNOWN_COMPLICATIONS); "other"
// catches exotica, with detail in notes.
export const strapMaterialSchema = z.enum([
  "leather",
  "suede",
  "alligator",
  "rubber",
  "silicone",
  "sailcloth",
  "nylon",
  "canvas",
  "perlon",
  "mesh",
  "steel",
  "titanium",
  "other",
])

export type StrapMaterial = z.infer<typeof strapMaterialSchema>

export const strapMaterialLabels: Record<StrapMaterial, string> = {
  leather: "Leather",
  suede: "Suede",
  alligator: "Alligator / Exotic",
  rubber: "Rubber",
  silicone: "Silicone",
  sailcloth: "Sailcloth",
  nylon: "Nylon / NATO",
  canvas: "Canvas",
  perlon: "Perlon",
  mesh: "Mesh bracelet",
  steel: "Steel bracelet",
  titanium: "Titanium bracelet",
  other: "Other",
}

// Strap form schema — validates create/update input (FormData conventions:
// checkboxes send "on", empty selects send "").
export const strapFormSchema = z.object({
  name: z.string().optional().default(""),
  manufacturer: z.string().optional().default(""),
  material: strapMaterialSchema,
  color: z.string().optional().default(""),

  // The one required dimension — drives Phase Two lug-width matching.
  width_mm: z
    .string()
    .min(1, "Width is required")
    .transform((val) => parseFloat(val))
    .pipe(z.number().min(6, "Width must be 6–30mm").max(30, "Width must be 6–30mm")),

  quick_release: z
    .string()
    .optional()
    .transform((v) => v === "on"),
  micro_adjust: z
    .string()
    .optional()
    .transform((v) => v === "on"),

  source: z.string().optional().default(""),
  source_watch_id: z.string().optional().default(""),
  current_watch_id: z.string().optional().default(""),

  purchase_date: z.string().optional().default(""),
  purchase_price: z
    .string()
    .optional()
    .default("")
    .transform((val) => (val === "" ? null : parseFloat(val)))
    .pipe(z.number().min(0).nullable()),

  notes: z.string().optional().default(""),
})

export type StrapFormValues = z.input<typeof strapFormSchema>
export type StrapFormParsed = z.output<typeof strapFormSchema>

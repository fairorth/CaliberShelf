import { z } from "zod"

// Matches the Postgres enum public.brand_type (migration 00023)
export const brandTypeSchema = z.enum(["major", "micro", "indie"])

export const brandFormSchema = z.object({
  name: z.string().min(1, "Brand name is required").max(100),
  country_of_origin: z.string().optional().default(""),
  // Optional enum field (empty string = null in the database)
  brand_type: z.union([brandTypeSchema, z.literal("")]).optional().default(""),
  // Official web store — the deal scanner polls {store_url}/products.json
  store_url: z
    .string()
    .optional()
    .default("")
    .transform((val) => val.trim().replace(/\/+$/, "")),
  // Wish-list brand — no owned watches yet, but we want one. Accepts the
  // checkbox's "on" (form-bound createBrand) or a boolean (direct updateBrand).
  is_wishlist: z
    .union([z.string(), z.boolean()])
    .optional()
    .transform((v) => v === "on" || v === true),
})

export type BrandFormValues = z.input<typeof brandFormSchema>
export type BrandFormParsed = z.output<typeof brandFormSchema>

// Display labels for brand_type values
export const brandTypeLabels: Record<string, string> = {
  major: "Major",
  micro: "Microbrand",
  indie: "Independent",
}

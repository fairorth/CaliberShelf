import { z } from "zod"

export const brandFormSchema = z.object({
  name: z.string().min(1, "Brand name is required").max(100),
  country_of_origin: z.string().optional().default(""),
})

export type BrandFormValues = z.input<typeof brandFormSchema>
export type BrandFormParsed = z.output<typeof brandFormSchema>

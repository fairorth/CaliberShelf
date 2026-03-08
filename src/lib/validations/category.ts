import { z } from "zod"

export const categoryFormSchema = z.object({
  name: z.string().min(1, "Category name is required").max(100),
  description: z.string().optional().default(""),
})

export type CategoryFormValues = z.input<typeof categoryFormSchema>
export type CategoryFormParsed = z.output<typeof categoryFormSchema>

import { z } from "zod"

/** Full wear log form — used by AddWearDialog */
export const wearLogFormSchema = z.object({
  watch_id: z.string().min(1, "Watch is required"),
  worn_date: z
    .string()
    .min(1, "Date is required")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  notes: z.string().optional().default(""),
})

export type WearLogFormValues = z.input<typeof wearLogFormSchema>
export type WearLogFormParsed = z.output<typeof wearLogFormSchema>

/** Quick-wear — just the watch ID, date defaults to today */
export const quickWearSchema = z.object({
  watch_id: z.string().min(1, "Watch is required"),
})

/** Inline notes editing */
export const wearLogNotesSchema = z.object({
  notes: z.string().optional().default(""),
})

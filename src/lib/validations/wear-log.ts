import { z } from "zod"
import { wearFeelSchema } from "./keep"
import { isPlausibleLocalToday } from "@/lib/dates"

/** Full wear log form — used by AddWearDialog */
export const wearLogFormSchema = z.object({
  watch_id: z.string().min(1, "Watch is required"),
  worn_date: z
    .string()
    .min(1, "Date is required")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  notes: z.string().optional().default(""),
  // How it felt (00054). "" = not recorded.
  feel: z.union([wearFeelSchema, z.literal("")]).optional().default(""),
})

export type WearLogFormValues = z.input<typeof wearLogFormSchema>
export type WearLogFormParsed = z.output<typeof wearLogFormSchema>

/**
 * Quick-wear — the watch and the CLIENT's local today. The date is required:
 * the server's clock is UTC and would log a US evening as tomorrow (B1).
 */
export const quickWearSchema = z.object({
  watch_id: z.string().min(1, "Watch is required"),
  worn_date: z
    .string()
    .refine(isPlausibleLocalToday, "That date isn't today."),
})

/** Inline notes editing */
export const wearLogNotesSchema = z.object({
  notes: z.string().optional().default(""),
})

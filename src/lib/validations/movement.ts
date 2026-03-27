import { z } from "zod"

export const caliberTypeSchema = z.enum([
  "quartz",
  "mechanical_manual",
  "mechanical_automatic",
])

export const caliberTypeLabels: Record<string, string> = {
  quartz: "Quartz",
  mechanical_manual: "Mechanical - Manual",
  mechanical_automatic: "Mechanical - Automatic",
}

export const movementFormSchema = z.object({
  caliber_name: z.string().min(1, "Caliber name is required").max(100),
  manufacturer: z.string().optional().default(""),
  caliber_type: z.union([caliberTypeSchema, z.literal("")]).optional().default(""),
  beat_rate: z.string().optional().default(""),
  power_reserve: z.string().optional().default(""),
})

export type MovementFormValues = z.input<typeof movementFormSchema>
export type MovementFormParsed = z.output<typeof movementFormSchema>

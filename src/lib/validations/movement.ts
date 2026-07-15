import { z } from "zod"

export const caliberTypeSchema = z.enum([
  "quartz",
  "mechanical_manual",
  "mechanical_automatic",
])

// Display labels kept short (no "Mechanical -" prefix) — shown everywhere:
// movements table, form dropdown, collection columns, filters, home dial/hero.
export const caliberTypeLabels: Record<string, string> = {
  quartz: "Quartz",
  mechanical_manual: "Manual",
  mechanical_automatic: "Automatic",
}

export const movementFormSchema = z.object({
  caliber_name: z.string().min(1, "Caliber name is required").max(100),
  manufacturer: z.string().optional().default(""),
  caliber_type: z.union([caliberTypeSchema, z.literal("")]).optional().default(""),
  beat_rate: z.string().optional().default(""),
  power_reserve: z.string().optional().default(""),
  lift_angle: z.string().optional().default(""),
})

export type MovementFormValues = z.input<typeof movementFormSchema>
export type MovementFormParsed = z.output<typeof movementFormSchema>

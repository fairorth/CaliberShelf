import { z } from "zod"
import { movementTypeSchema } from "./watch"

export const displayTypeSchema = z.enum(["analog", "digital", "ana_digi"])

export const displayTypeLabels: Record<string, string> = {
  analog: "Analog",
  digital: "Digital",
  ana_digi: "Ana-Digi",
}

export const movementFormSchema = z.object({
  // Identity
  caliber_name: z.string().min(1, "Caliber name is required").max(100),
  manufacturer: z.string().optional().default(""),
  base_caliber: z.string().optional().default(""),
  aliases: z.string().optional().default(""),

  // Classification
  movement_type: movementTypeSchema,
  display_type: displayTypeSchema.default("analog"),

  // Dimensions
  diameter_mm: z
    .string()
    .optional()
    .default("")
    .transform((val) => (val === "" ? null : parseFloat(val)))
    .pipe(z.number().min(5).max(50).nullable()),
  height_mm: z
    .string()
    .optional()
    .default("")
    .transform((val) => (val === "" ? null : parseFloat(val)))
    .pipe(z.number().min(0.5).max(20).nullable()),

  // Performance
  jewel_count: z
    .string()
    .optional()
    .default("")
    .transform((val) => (val === "" ? null : parseInt(val, 10)))
    .pipe(z.number().min(0).max(100).nullable()),
  beat_rate_vph: z
    .string()
    .optional()
    .default("")
    .transform((val) => (val === "" ? null : parseInt(val, 10)))
    .pipe(z.number().min(0).max(72000).nullable()),
  power_reserve_hours: z
    .string()
    .optional()
    .default("")
    .transform((val) => (val === "" ? null : parseInt(val, 10)))
    .pipe(z.number().min(0).max(100000).nullable()),
  accuracy_range: z.string().optional().default(""),

  // Features (checkboxes come as "on" or absent)
  hacking: z
    .union([z.boolean(), z.literal("on"), z.literal("")])
    .optional()
    .default(false)
    .transform((val) => val === "on" || val === true),
  hand_windable: z
    .union([z.boolean(), z.literal("on"), z.literal("")])
    .optional()
    .default(false)
    .transform((val) => val === "on" || val === true),
  quickset_date: z
    .union([z.boolean(), z.literal("on"), z.literal("")])
    .optional()
    .default(false)
    .transform((val) => val === "on" || val === true),

  // Complications & meta
  complications: z.string().optional().default(""),
  country_of_origin: z.string().optional().default(""),
  production_year_start: z
    .string()
    .optional()
    .default("")
    .transform((val) => (val === "" ? null : parseInt(val, 10)))
    .pipe(z.number().min(1700).max(2100).nullable()),
  production_year_end: z
    .string()
    .optional()
    .default("")
    .transform((val) => (val === "" ? null : parseInt(val, 10)))
    .pipe(z.number().min(1700).max(2100).nullable()),
})

export type MovementFormValues = z.input<typeof movementFormSchema>
export type MovementFormParsed = z.output<typeof movementFormSchema>

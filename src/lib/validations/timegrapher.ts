import { z } from "zod"

/**
 * Timegrapher run form — one measurement session.
 * Rate may be negative (slow) or positive (fast); amplitude and beat error are
 * non-negative. All readings are optional so a partial run can still be saved,
 * but at least one reading must be present.
 */
export const timegrapherRunFormSchema = z
  .object({
    watch_id: z.string().min(1, "Watch is required"),
    run_date: z
      .string()
      .min(1, "Date is required")
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
    rate_sec_per_day: z
      .string()
      .optional()
      .default("")
      .transform((val) => (val.trim() === "" ? null : parseFloat(val)))
      .pipe(z.number().min(-90).max(90).nullable()),
    amplitude_deg: z
      .string()
      .optional()
      .default("")
      .transform((val) => (val.trim() === "" ? null : parseFloat(val)))
      .pipe(z.number().min(100).max(360).nullable()),
    beat_error_ms: z
      .string()
      .optional()
      .default("")
      .transform((val) => (val.trim() === "" ? null : parseFloat(val)))
      .pipe(z.number().min(0).max(20).nullable()),
    notes: z.string().optional().default(""),
  })
  .refine(
    (data) =>
      data.rate_sec_per_day !== null ||
      data.amplitude_deg !== null ||
      data.beat_error_ms !== null,
    { message: "Enter at least one reading (rate, amplitude, or beat error)." }
  )

export type TimegrapherRunFormValues = z.input<typeof timegrapherRunFormSchema>
export type TimegrapherRunFormParsed = z.output<typeof timegrapherRunFormSchema>

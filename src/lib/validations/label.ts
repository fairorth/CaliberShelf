import { z } from "zod"

export const labelColorSchema = z.enum([
  "red",
  "orange",
  "amber",
  "green",
  "teal",
  "blue",
  "purple",
  "pink",
])

export type LabelColor = z.infer<typeof labelColorSchema>

/** Maps label color names to Tailwind badge classes (bg + text).
 *
 *  These are user-chosen *data* colours, not UI accent — brass remains the
 *  only accent (E1), so a "blue" label here is not a one-accent violation.
 *  The text step is 700, not 400: 400 was legible against the old dark
 *  surfaces but falls to roughly 2:1 on the light `/20` chip now that light
 *  is the only theme (FIXES §1). */
export const labelColorMap: Record<LabelColor, { bg: string; text: string }> = {
  red:    { bg: "bg-red-500/20",    text: "text-red-700" },
  orange: { bg: "bg-orange-500/20", text: "text-orange-700" },
  amber:  { bg: "bg-amber-500/20",  text: "text-amber-700" },
  green:  { bg: "bg-green-500/20",  text: "text-green-700" },
  teal:   { bg: "bg-teal-500/20",   text: "text-teal-700" },
  blue:   { bg: "bg-blue-500/20",   text: "text-blue-700" },
  purple: { bg: "bg-purple-500/20", text: "text-purple-700" },
  pink:   { bg: "bg-pink-500/20",   text: "text-pink-700" },
}

export const labelFormSchema = z.object({
  name: z.string().min(1, "Label name is required").max(50),
  color: labelColorSchema.default("blue"),
})

export type LabelFormValues = z.input<typeof labelFormSchema>
export type LabelFormParsed = z.output<typeof labelFormSchema>

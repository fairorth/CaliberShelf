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

/** Maps label color names to Tailwind badge classes (bg + text) */
export const labelColorMap: Record<LabelColor, { bg: string; text: string }> = {
  red:    { bg: "bg-red-500/20",    text: "text-red-400" },
  orange: { bg: "bg-orange-500/20", text: "text-orange-400" },
  amber:  { bg: "bg-amber-500/20",  text: "text-amber-400" },
  green:  { bg: "bg-green-500/20",  text: "text-green-400" },
  teal:   { bg: "bg-teal-500/20",   text: "text-teal-400" },
  blue:   { bg: "bg-blue-500/20",   text: "text-blue-400" },
  purple: { bg: "bg-purple-500/20", text: "text-purple-400" },
  pink:   { bg: "bg-pink-500/20",   text: "text-pink-400" },
}

export const labelFormSchema = z.object({
  name: z.string().min(1, "Label name is required").max(50),
  color: labelColorSchema.default("blue"),
})

export type LabelFormValues = z.input<typeof labelFormSchema>
export type LabelFormParsed = z.output<typeof labelFormSchema>

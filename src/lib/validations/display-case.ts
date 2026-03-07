import { z } from "zod"

export const caseSizeSchema = z.enum(["3", "8", "24", "40"])

export const caseSizeLabels: Record<string, string> = {
  "3": "3-Watch Case",
  "8": "8-Watch Case",
  "24": "24-Watch Case",
  "40": "40-Watch Case",
}

// Grid layout for each case size: [columns, rows]
export const caseSizeLayouts: Record<string, [number, number]> = {
  "3": [3, 1],
  "8": [4, 2],
  "24": [6, 4],
  "40": [8, 5],
}

export const displayCaseFormSchema = z.object({
  name: z.string().min(1, "Case name is required").max(100),
  description: z.string().optional().default(""),
  capacity: caseSizeSchema,
  case_type: z.string().optional().default(""),
})

export type DisplayCaseFormValues = z.input<typeof displayCaseFormSchema>
export type DisplayCaseFormParsed = z.output<typeof displayCaseFormSchema>

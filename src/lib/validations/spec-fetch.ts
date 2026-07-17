import { z } from "zod"
import {
  caseMaterialSchema,
  crystalTypeSchema,
  caseShapeSchema,
  bezelTypeSchema,
  bezelMaterialSchema,
} from "@/lib/validations/watch"

// Request body for POST /api/spec-fetch
export const specFetchRequestSchema = z.object({
  brand: z.string().min(1, "Brand is required"),
  model: z.string().min(1, "Model is required"),
  reference_number: z.string().optional().default(""),
})

// Structured output the spec-fetch agent must produce. Enum fields reuse the
// watch-form schemas so the agent can only return values the form accepts.
// null = "could not determine" — never guessed.
export const specFetchResultSchema = z.object({
  case_diameter_mm: z.number().nullable(),
  lug_to_lug_mm: z.number().nullable(),
  strap_width_mm: z.number().nullable(),
  case_height_mm: z.number().nullable(),
  weight_g: z.number().nullable(),
  water_resistance_m: z.number().nullable(),
  case_material: caseMaterialSchema.nullable(),
  crystal: crystalTypeSchema.nullable(),
  case_shape: caseShapeSchema.nullable(),
  bezel_type: bezelTypeSchema.nullable(),
  bezel_material: bezelMaterialSchema.nullable(),
  dial_color: z.string().nullable(),
  complications: z.array(z.string()),
  suggested_caliber: z.string().nullable(),
  confidence: z.enum(["high", "medium", "low"]),
  sources: z.array(z.string()),
  notes: z.string().nullable(),
})

export type SpecFetchResult = z.infer<typeof specFetchResultSchema>

// Full response shape returned by the route (specs + cost accounting)
export interface SpecFetchResponse {
  specs: SpecFetchResult
  usage: {
    input_tokens: number
    output_tokens: number
    searches: number
    cost_usd: number
  }
  model: string
}

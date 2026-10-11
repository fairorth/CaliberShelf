import { z } from "zod"

/**
 * POST /api/identify — "which watch is this?" from one photo (docs/iphone-app.md
 * §3). This file is the contract between the route and the iPhone app, so it
 * imports nothing app-specific: the phone imports it as-is.
 */

/** ~1024px on the long edge is plenty to tell watches apart and keeps the
 *  request well under the serverless body limit. The phone downsizes first. */
export const IDENTIFY_MAX_IMAGE_BYTES = 3_000_000

export const identifyRequestSchema = z.object({
  /** Base64 image data, no `data:` prefix. */
  image_base64: z
    .string()
    .min(1, "A photo is required")
    // base64 is 4/3 the byte size
    .max(Math.ceil((IDENTIFY_MAX_IMAGE_BYTES * 4) / 3), "That photo is too large — send it at about 1024px."),
  media_type: z.enum(["image/jpeg", "image/png", "image/webp"]),
})

export type IdentifyRequest = z.infer<typeof identifyRequestSchema>

/**
 * What the model must return. `matches` are ROSTER ids only — the route drops
 * any id it did not send. `guess` describes the watch in the photo in its own
 * right, so "not in your collection" still has something to pre-fill Add with.
 */
export const identifyResultSchema = z.object({
  matches: z
    .array(
      z.object({
        watch_id: z.string(),
        confidence: z.enum(["high", "medium", "low"]),
        /** One short phrase: what in the photo decided it. */
        reason: z.string(),
      })
    )
    .max(3),
  guess: z
    .object({
      brand: z.string().nullable(),
      model: z.string().nullable(),
      reference_number: z.string().nullable(),
      dial_color: z.string().nullable(),
    })
    .nullable(),
  /** False when the photo shows no watch at all (or nothing legible). */
  watch_visible: z.boolean(),
  notes: z.string().nullable(),
})

export type IdentifyResult = z.infer<typeof identifyResultSchema>

export interface IdentifyResponse {
  /** Best first, at most 3, every id belongs to the caller. */
  matches: IdentifyResult["matches"]
  /** Present when nothing matched with confidence — what Add should pre-fill. */
  guess: IdentifyResult["guess"]
  watch_visible: boolean
  notes: string | null
  usage: { input_tokens: number; output_tokens: number; cost_usd: number }
  model: string
}

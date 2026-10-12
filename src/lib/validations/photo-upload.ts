import { z } from "zod"
import { PHOTO_ANGLES } from "@/lib/photo-lab"
import type { PhotoAngle } from "@/lib/types/watch"

/**
 * POST /api/watches/:id/photos as JSON — how the iPhone app uploads a frame.
 * Shared with the phone (it imports this file), so the two cannot drift.
 *
 * Base64 JSON rather than multipart because Expo's fetch rejects React
 * Native's `{ uri, name, type }` FormData parts ("Unsupported FormDataPart
 * implementation", camera trial build 1) — and JSON + base64 is the path
 * /api/identify already proved on the device. A 2000px JPEG is ~1MB, ~1.4MB
 * as base64: comfortably under the serverless request-body limit.
 */
export const PHONE_PHOTO_MAX_BASE64 = 4_000_000

export const phonePhotoUploadSchema = z.object({
  image_base64: z
    .string()
    .min(1, "A photo is required")
    .max(PHONE_PHOTO_MAX_BASE64, "That photo is too large — send it at 2000px."),
  media_type: z.enum(["image/jpeg", "image/png", "image/webp", "image/heic"]),
  angle: z
    .enum(PHOTO_ANGLES as [PhotoAngle, ...PhotoAngle[]])
    .nullable()
    .optional(),
})

export type PhonePhotoUpload = z.infer<typeof phonePhotoUploadSchema>

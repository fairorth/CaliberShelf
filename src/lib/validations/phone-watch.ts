import { z } from "zod"
import { PHONE_PHOTO_MAX_BASE64 } from "./photo-upload"

/**
 * POST /api/watches — the iPhone app's "Add a watch" (docs/iphone-app.md §4).
 * Shared with the phone, which imports this file, so the two cannot drift.
 *
 * Deliberately the web's quick-add fields (validations/watch.ts
 * quickAddSchema) plus the three the camera is good at — reference (flagged
 * unverified when it came from the photo, exactly like spec autofill), box,
 * and the photo itself. Measurements, complications, movement and labels stay
 * on the web's edit form.
 */
export const PHONE_OWNERSHIP = ["owned", "coming", "wish"] as const
export type PhoneOwnership = (typeof PHONE_OWNERSHIP)[number]

export const phoneAddWatchSchema = z
  .object({
    /** An existing brand… */
    brand_id: z.string().min(1).optional(),
    /** …or a new one, created (or matched by exact name) on save. */
    new_brand_name: z.string().trim().min(1).max(80).optional(),
    model: z.string().trim().min(1, "Model is required").max(200),
    reference_number: z.string().trim().max(80).nullable().optional(),
    /** True when the reference came from Identify rather than the owner. */
    reference_unverified: z.boolean().optional().default(false),
    category_id: z.string().min(1, "Category is required"),
    ownership: z.enum(PHONE_OWNERSHIP),
    /** YYYY-MM-DD. The phone defaults it to its local today (Marc,
     *  2026-10-13); ignored for wish-list entries, which aren't bought. */
    purchase_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Purchase date must be YYYY-MM-DD")
      .refine((v) => !Number.isNaN(Date.parse(`${v}T00:00:00Z`)), "That isn't a real date")
      .nullable()
      .optional(),
    /** For wish-list entries, the estimated future price (as on the web). */
    purchase_price_cents: z.number().int().min(0).nullable().optional(),
    /** Sales tax and import fees (duty, customs, brokerage) paid on the
     *  purchase — watches.acq_tax_cents / acq_duty_cents, part of cost basis.
     *  Ignored for wish-list entries. */
    acq_tax_cents: z.number().int().min(0).nullable().optional(),
    acq_duty_cents: z.number().int().min(0).nullable().optional(),
    box: z.string().trim().max(40).nullable().optional(),
    /** The cover photo, as from the camera (see photo-upload.ts for why base64). */
    image_base64: z.string().max(PHONE_PHOTO_MAX_BASE64).optional(),
    media_type: z.enum(["image/jpeg", "image/png", "image/webp", "image/heic"]).optional(),
  })
  .refine((d) => !!d.brand_id || !!d.new_brand_name, {
    message: "Brand is required",
    path: ["brand_id"],
  })

export type PhoneAddWatch = z.input<typeof phoneAddWatchSchema>

export interface PhoneAddWatchResponse {
  watchId: string
  /** Set when the watch saved but its photo did not — the watch still exists. */
  photoError?: string
}

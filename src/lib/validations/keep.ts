import { z } from "zod"

// NOTE: this module must not import ./watch — watch.ts imports these schemas
// for the watch form, and a cycle between the two would leave one side's
// consts undefined at load. The schema that needs BOTH (keepFieldsSchema)
// therefore lives in watch.ts.

// The Edit (00054) — the owner's judgements that sit beside attachment.
// Each list is ordered the way its control reads left to right, and each
// order lives here and nowhere else (same rule as ATTACHMENT_LEVELS).

/** The floor piles. NULL = undecided. Precedes sale_status; is not part of it. */
export const KEEP_DECISIONS = ["keep", "maybe", "sell"] as const
export type KeepDecision = (typeof KEEP_DECISIONS)[number]
export const keepDecisionSchema = z.enum(KEEP_DECISIONS)

export const keepDecisionLabels: Record<KeepDecision, string> = {
  keep: "Keep",
  maybe: "Maybe",
  sell: "Sell",
}

/** "Could I buy this again at this price?" — strongest-to-keep last. */
export const REPLACEABILITY_LEVELS = ["easy", "findable", "rare", "irreplaceable"] as const
export type Replaceability = (typeof REPLACEABILITY_LEVELS)[number]
export const replaceabilitySchema = z.enum(REPLACEABILITY_LEVELS)

export const replaceabilityLabels: Record<Replaceability, string> = {
  easy: "Easy",
  findable: "Findable",
  rare: "Rare",
  irreplaceable: "Irreplaceable",
}

export const replaceabilityHints: Record<Replaceability, string> = {
  easy: "Buy another tomorrow at this price",
  findable: "Takes some hunting, but they come up",
  rare: "Seldom seen, or not at this price",
  irreplaceable: "Would never find another",
}

/** How a watch felt after a day on the wrist (wear_logs.feel). */
export const WEAR_FEELS = ["loved", "fine", "meh"] as const
export type WearFeel = (typeof WEAR_FEELS)[number]
export const wearFeelSchema = z.enum(WEAR_FEELS)

export const wearFeelLabels: Record<WearFeel, string> = {
  loved: "Loved it",
  fine: "Fine",
  meh: "Meh",
}

export const faceoffSchema = z
  .object({
    winnerId: z.uuid(),
    loserId: z.uuid(),
  })
  .refine((v) => v.winnerId !== v.loserId, { message: "A watch cannot face itself." })

/** The sale goal on the To Sell view. Dollars in, cents stored. */
export const saleGoalSchema = z.object({
  goal: z
    .number({ error: "Enter a goal amount." })
    .min(0, "The goal cannot be negative.")
    .max(10_000_000, "That goal is out of range.")
    .nullable(),
  label: z.string().trim().max(80, "Keep the label under 80 characters."),
  feePct: z
    .number({ error: "Enter a fee percentage." })
    .min(0, "Fees cannot be negative.")
    .max(50, "Fees above 50% are not plausible."),
})

export type SaleGoalInput = z.infer<typeof saleGoalSchema>

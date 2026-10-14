import "server-only"
import Anthropic from "@anthropic-ai/sdk"
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod"
import type { SupabaseClient } from "@supabase/supabase-js"
import { generateThumbnail, thumbPathFor } from "@/lib/thumbnails"
import { dimensionColumns, readImageDimensions } from "@/lib/image-meta"
import { placardReadSchema } from "@/lib/validations/admired"
import type { AdmiredFields, AdmiredPhotoKind, AdmiredPhotoResponse, PlacardRead } from "@/lib/validations/admired"

/**
 * The ONE implementation of Admired (migration 00056), for any caller holding
 * a Supabase client acting AS THE USER: the iPhone's routes (/api/admired…,
 * bearer token) and the web's Server Actions (actions/admired-actions.ts).
 *
 * Creates and photo uploads are IDEMPOTENT by client-generated id: the phone
 * queues captures offline and may send one twice after a flaky reconnect.
 */

const BUCKET = "watch-photos"

/** Placard reader: a short structured vision call. Same model choice and
 *  fallback as /api/identify; Marc chose Opus 5.5 for identify (2026-10-12). */
const PLACARD_MODEL = "claude-opus-5-5"
const PLACARD_FALLBACK_MODEL = "claude-opus-4-8"
const PRICE_PER_MTOK = { input: 4, cacheWrite: 5, cacheRead: 0.2, output: 20 }

const PLACARD_PROMPT = `You read the information card ("placard") beside a watch at a watch show, gallery or shop.

Transcribe what is PRINTED on the card into the fields. Rules:
- Read only the card. Never infer anything from a watch that may also be in
  the photo, and never fill a field from general knowledge.
- "maker": the brand or watchmaker as printed (e.g. "Petermann Bédat",
  "Rexhep Rexhepi", "Kudoke"). Keep accents and capitalisation as printed.
- "model": the model / piece name as printed. "reference": a reference number
  only if one is printed as such.
- "price_text": exactly as printed, currency included ("CHF 48,000",
  "USD 12,500", "Price on request"). Null if no price is shown.
- "details": other printed facts worth keeping — movement/calibre, limited
  edition count, case material, dimensions — as one or two short lines.
- Null any field the card doesn't show. "legible": false if the image is not a
  readable card or sign (then everything else null).`

export type FillableField = "maker" | "model" | "reference" | "price_text" | "notes"

function isDuplicate(error: { code?: string } | null): boolean {
  return error?.code === "23505"
}

export async function createAdmiredFor(
  supabase: SupabaseClient,
  userId: string,
  input: AdmiredFields & { id: string; seen_on: string }
): Promise<{ id: string } | { error: string }> {
  const { error } = await supabase.from("admired_watches").insert({
    id: input.id,
    user_id: userId,
    event: input.event ?? null,
    maker: input.maker ?? null,
    model: input.model ?? null,
    reference: input.reference ?? null,
    price_text: input.price_text ?? null,
    notes: input.notes ?? null,
    tags: input.tags ?? [],
    seen_on: input.seen_on,
  })
  // A retry of a create that already landed is success, not an error.
  if (error && !isDuplicate(error)) return { error: error.message }
  return { id: input.id }
}

export async function updateAdmiredFor(
  supabase: SupabaseClient,
  userId: string,
  id: string,
  fields: AdmiredFields
): Promise<{ ok: true } | { error: string }> {
  const patch: Record<string, unknown> = {}
  for (const k of ["event", "maker", "model", "reference", "price_text", "notes", "tags", "seen_on"] as const) {
    if (fields[k] !== undefined) patch[k] = k === "tags" ? (fields.tags ?? []) : (fields[k] || null)
  }
  if (Object.keys(patch).length === 0) return { ok: true }
  const { error } = await supabase.from("admired_watches").update(patch).eq("id", id).eq("user_id", userId)
  if (error) return { error: error.message }
  return { ok: true }
}

/** Delete an admired watch and every one of its stored frames. */
export async function deleteAdmiredFor(
  supabase: SupabaseClient,
  userId: string,
  id: string
): Promise<{ ok: true } | { error: string }> {
  const { data: photos } = await supabase
    .from("admired_photos")
    .select("storage_path, thumb_path")
    .eq("admired_id", id)
    .eq("user_id", userId)
  const paths = ((photos ?? []) as Array<{ storage_path: string; thumb_path: string | null }>).flatMap((p) => [
    p.storage_path,
    p.thumb_path ?? thumbPathFor(p.storage_path),
  ])
  if (paths.length) await supabase.storage.from(BUCKET).remove(paths)
  // Photos go with it (ON DELETE CASCADE).
  const { error } = await supabase.from("admired_watches").delete().eq("id", id).eq("user_id", userId)
  if (error) return { error: error.message }
  return { ok: true }
}

/**
 * Store one frame. Deterministic path from the client id, so a retried upload
 * overwrites itself rather than leaving an orphan.
 */
export async function storeAdmiredPhotoFor(
  supabase: SupabaseClient,
  userId: string,
  admiredId: string,
  photo: { id: string; kind: AdmiredPhotoKind; bytes: Buffer; mediaType: string; displayOrder?: number }
): Promise<{ photoId: string; duplicate: boolean } | { error: string }> {
  const { data: parent } = await supabase
    .from("admired_watches")
    .select("id")
    .eq("id", admiredId)
    .eq("user_id", userId)
    .maybeSingle()
  if (!parent) return { error: "Admired watch not found." }

  const { data: existing } = await supabase
    .from("admired_photos")
    .select("id")
    .eq("id", photo.id)
    .eq("user_id", userId)
    .maybeSingle()
  if (existing) return { photoId: photo.id, duplicate: true }

  const ext = photo.mediaType.split("/")[1] === "jpeg" ? "jpg" : (photo.mediaType.split("/")[1] ?? "jpg")
  const storagePath = `${userId}/admired/${admiredId}/${photo.id}.${ext}`
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, photo.bytes, { contentType: photo.mediaType, upsert: true })
  if (uploadError) return { error: `Upload failed: ${uploadError.message}` }

  const arrayBuffer = photo.bytes.buffer.slice(
    photo.bytes.byteOffset,
    photo.bytes.byteOffset + photo.bytes.byteLength
  ) as ArrayBuffer
  const thumbPath = await generateThumbnail(supabase, storagePath, arrayBuffer)
  const dims = await readImageDimensions(photo.bytes)

  const { error } = await supabase.from("admired_photos").insert({
    id: photo.id,
    admired_id: admiredId,
    user_id: userId,
    storage_path: storagePath,
    thumb_path: thumbPath,
    kind: photo.kind,
    display_order: photo.displayOrder ?? 0,
    ...dimensionColumns(dims),
  })
  if (error && isDuplicate(error)) return { photoId: photo.id, duplicate: true }
  if (error) {
    await supabase.storage.from(BUCKET).remove([storagePath, thumbPathFor(storagePath)])
    return { error: `Failed to save photo: ${error.message}` }
  }
  return { photoId: photo.id, duplicate: false }
}

export async function deleteAdmiredPhotoFor(
  supabase: SupabaseClient,
  userId: string,
  photoId: string
): Promise<{ ok: true } | { error: string }> {
  const { data: photo } = await supabase
    .from("admired_photos")
    .select("storage_path, thumb_path")
    .eq("id", photoId)
    .eq("user_id", userId)
    .maybeSingle()
  if (!photo) return { error: "Photo not found." }
  const p = photo as { storage_path: string; thumb_path: string | null }
  await supabase.storage.from(BUCKET).remove([p.storage_path, p.thumb_path ?? thumbPathFor(p.storage_path)])
  const { error } = await supabase.from("admired_photos").delete().eq("id", photoId).eq("user_id", userId)
  if (error) return { error: error.message }
  return { ok: true }
}

/**
 * Read a placard frame and fill the admired watch's EMPTY fields — never one
 * the owner already set. Printed extras (movement, edition) go into notes
 * only if notes are empty. Logged to agent_runs once (no UPDATE policy).
 */
export async function readPlacardFor(
  supabase: SupabaseClient,
  userId: string,
  admiredId: string,
  imageBase64: string,
  mediaType: string
): Promise<NonNullable<AdmiredPhotoResponse["placard"]> | { error: string }> {
  // Claude's image input takes JPEG, PNG, WebP or GIF — not HEIC. The phone
  // always sends JPEG; anything else is reported, not guessed at.
  if (mediaType !== "image/jpeg" && mediaType !== "image/png" && mediaType !== "image/webp") {
    return { error: "Placards must be JPEG, PNG or WebP to be read." }
  }
  if (!process.env.ANTHROPIC_API_KEY) return { error: "ANTHROPIC_API_KEY is not configured on the server." }
  const startedAt = Date.now()
  const anthropic = new Anthropic()

  let read: PlacardRead
  let costUsd = 0
  let usedModel = PLACARD_MODEL
  let tokensIn = 0
  let tokensOut = 0
  try {
    const response = await anthropic.beta.messages.parse({
      model: PLACARD_MODEL,
      max_tokens: 4000,
      output_config: { effort: "low", format: betaZodOutputFormat(placardReadSchema) },
      betas: ["server-side-fallback-2026-06-01"],
      fallbacks: [{ model: PLACARD_FALLBACK_MODEL }],
      system: PLACARD_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: imageBase64 } },
            { type: "text", text: "Read this placard." },
          ],
        },
      ],
    })
    if (response.stop_reason === "refusal" || !response.parsed_output) {
      return { error: "Couldn't read that placard." }
    }
    read = response.parsed_output
    usedModel = response.model
    const u = response.usage
    tokensIn = u.input_tokens + (u.cache_creation_input_tokens ?? 0) + (u.cache_read_input_tokens ?? 0)
    tokensOut = u.output_tokens
    costUsd =
      (u.input_tokens * PRICE_PER_MTOK.input +
        (u.cache_creation_input_tokens ?? 0) * PRICE_PER_MTOK.cacheWrite +
        (u.cache_read_input_tokens ?? 0) * PRICE_PER_MTOK.cacheRead +
        u.output_tokens * PRICE_PER_MTOK.output) /
      1_000_000
  } catch (e) {
    if (e instanceof Anthropic.APIError) return { error: `Claude API error: ${e.message}` }
    throw e
  }

  // Fill only what is empty.
  const { data: row } = await supabase
    .from("admired_watches")
    .select("maker, model, reference, price_text, notes")
    .eq("id", admiredId)
    .eq("user_id", userId)
    .maybeSingle()
  const current = (row ?? {}) as Partial<Record<FillableField, string | null>>
  const filled: FillableField[] = []
  const patch: Record<string, unknown> = { placard_read_at: new Date().toISOString() }
  const offer: Array<[FillableField, string | null]> = read.legible
    ? [
        ["maker", read.maker],
        ["model", read.model],
        ["reference", read.reference],
        ["price_text", read.price_text],
        ["notes", read.details],
      ]
    : []
  for (const [field, value] of offer) {
    const v = value?.trim()
    if (v && !current[field]?.trim()) {
      patch[field] = field === "notes" ? v.slice(0, 2000) : v.slice(0, field === "model" ? 200 : field === "reference" || field === "price_text" ? 80 : 120)
      filled.push(field)
    }
  }
  await supabase.from("admired_watches").update(patch).eq("id", admiredId).eq("user_id", userId)

  try {
    await supabase.from("agent_runs").insert({
      user_id: userId,
      agent: "placard-read",
      trigger: "ui-click",
      status: "success",
      started_at: new Date(startedAt).toISOString(),
      finished_at: new Date().toISOString(),
      duration_ms: Date.now() - startedAt,
      model: usedModel,
      items_processed: 1,
      items_updated: filled.length > 0 ? 1 : 0,
      input_tokens: tokensIn,
      output_tokens: tokensOut,
      web_searches: 0,
      cost_usd_micros: Math.round(costUsd * 1_000_000),
      notes: read.legible ? [read.maker, read.model].filter(Boolean).join(" ") || "legible, no name" : "not legible",
    })
  } catch {
    // logging is optional
  }

  return { read, filled, cost_usd: Math.round(costUsd * 1000) / 1000 }
}

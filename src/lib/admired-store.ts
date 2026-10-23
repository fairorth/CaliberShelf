import "server-only"
import Anthropic from "@anthropic-ai/sdk"
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod"
import type { SupabaseClient } from "@supabase/supabase-js"
import { generateThumbnail, thumbPathFor } from "@/lib/thumbnails"
import { dimensionColumns, readImageDimensions } from "@/lib/image-meta"
import type { z } from "zod"
import { isVendorKind, placardReadSchema, vendorNameReadSchema } from "@/lib/validations/admired"
import type {
  AdmiredFields,
  AdmiredPhotoKind,
  AdmiredPhotoMove,
  AdmiredPhotoResponse,
  PlacardRead,
  VendorFields,
  VendorNameRead,
} from "@/lib/validations/admired"

/**
 * The ONE implementation of Admired (migrations 00056, 00060), for any caller holding
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

const VENDOR_NAME_PROMPT = `You read the NAME of a watch-show exhibitor from a photo of their booth: a sign,
banner, backdrop, table card or business card.

Rules:
- "name": the brand, workshop or watchmaker's name exactly as printed (e.g.
  "Petermann Bédat", "Kudoke", "Atelier de Monaco"). Keep accents and
  capitalisation. If several names are printed, the most prominent one — the
  exhibitor, not a watch model or a sponsor.
- "details": other printed lines worth keeping in one short line — a city,
  a tagline, the watchmakers named. Null if none.
- Read only printed text. Never recognise a person's face, and never fill a
  field from general knowledge or from a watch in the photo.
- "legible": false if no name is readable (then name and details null).`

export type FillableField = "maker" | "model" | "reference" | "price_text" | "notes"

/** Our own errors that mean "your request was wrong" — the routes answer 422/404 for them, not 500. */
export const NOT_FOUND_WATCH = "Admired watch not found."
export const NOT_FOUND_VENDOR = "Vendor not found."

/**
 * One structured vision call (placard or vendor name): the same model, effort
 * and fallback for both. Returns the parsed output with its usage, or an error
 * string for the caller to surface — a frame is saved whether or not it reads.
 */
async function readImage<S extends z.ZodType>(
  schema: S,
  system: string,
  imageBase64: string,
  mediaType: string
): Promise<
  | { parsed: z.infer<S>; model: string; tokensIn: number; tokensOut: number; costUsd: number }
  | { error: string }
> {
  // Claude's image input takes JPEG, PNG, WebP or GIF — not HEIC. The phone
  // always sends JPEG; anything else is reported, not guessed at.
  if (mediaType !== "image/jpeg" && mediaType !== "image/png" && mediaType !== "image/webp") {
    return { error: "Only JPEG, PNG or WebP frames can be read." }
  }
  if (!process.env.ANTHROPIC_API_KEY) return { error: "ANTHROPIC_API_KEY is not configured on the server." }
  const anthropic = new Anthropic()
  try {
    const response = await anthropic.beta.messages.parse({
      model: PLACARD_MODEL,
      max_tokens: 4000,
      output_config: { effort: "low", format: betaZodOutputFormat(schema) },
      betas: ["server-side-fallback-2026-06-01"],
      fallbacks: [{ model: PLACARD_FALLBACK_MODEL }],
      system,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: imageBase64 } },
            { type: "text", text: "Read this." },
          ],
        },
      ],
    })
    if (response.stop_reason === "refusal" || !response.parsed_output) return { error: "Couldn't read that frame." }
    const u = response.usage
    return {
      parsed: response.parsed_output as z.infer<S>,
      model: response.model,
      tokensIn: u.input_tokens + (u.cache_creation_input_tokens ?? 0) + (u.cache_read_input_tokens ?? 0),
      tokensOut: u.output_tokens,
      costUsd:
        (u.input_tokens * PRICE_PER_MTOK.input +
          (u.cache_creation_input_tokens ?? 0) * PRICE_PER_MTOK.cacheWrite +
          (u.cache_read_input_tokens ?? 0) * PRICE_PER_MTOK.cacheRead +
          u.output_tokens * PRICE_PER_MTOK.output) /
        1_000_000,
    }
  } catch (e) {
    if (e instanceof Anthropic.APIError) return { error: `Claude API error: ${e.message}` }
    throw e
  }
}

/** One agent_runs row per read — written ONCE (the table has no UPDATE policy). */
async function logRead(
  supabase: SupabaseClient,
  userId: string,
  agent: "placard-read" | "vendor-name-read",
  startedAt: number,
  r: { model: string; tokensIn: number; tokensOut: number; costUsd: number },
  updated: boolean,
  notes: string
): Promise<void> {
  try {
    await supabase.from("agent_runs").insert({
      user_id: userId,
      agent,
      trigger: "ui-click",
      status: "success",
      started_at: new Date(startedAt).toISOString(),
      finished_at: new Date().toISOString(),
      duration_ms: Date.now() - startedAt,
      model: r.model,
      items_processed: 1,
      items_updated: updated ? 1 : 0,
      input_tokens: r.tokensIn,
      output_tokens: r.tokensOut,
      web_searches: 0,
      cost_usd_micros: Math.round(r.costUsd * 1_000_000),
      notes,
    })
  } catch {
    // logging is optional
  }
}

function isDuplicate(error: { code?: string } | null): boolean {
  return error?.code === "23505"
}

export async function createAdmiredFor(
  supabase: SupabaseClient,
  userId: string,
  input: AdmiredFields & { id: string; seen_on: string; vendor_id?: string | null }
): Promise<{ id: string } | { error: string }> {
  const { error } = await supabase.from("admired_watches").insert({
    id: input.id,
    user_id: userId,
    vendor_id: input.vendor_id ?? null,
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

type FrameInput = { id: string; kind: AdmiredPhotoKind; bytes: Buffer; mediaType: string; displayOrder?: number }

/**
 * Store one frame under its owner — a watch or a vendor. Deterministic path
 * from the client id, so a retried upload overwrites itself rather than
 * leaving an orphan; a frame already recorded is reported as a duplicate.
 */
async function storeFrameFor(
  supabase: SupabaseClient,
  userId: string,
  owner: { admiredId: string } | { vendorId: string },
  photo: FrameInput
): Promise<{ photoId: string; duplicate: boolean } | { error: string }> {
  const isVendor = "vendorId" in owner
  const { data: parent } = await supabase
    .from(isVendor ? "admired_vendors" : "admired_watches")
    .select("id")
    .eq("id", isVendor ? owner.vendorId : owner.admiredId)
    .eq("user_id", userId)
    .maybeSingle()
  if (!parent) return { error: isVendor ? NOT_FOUND_VENDOR : NOT_FOUND_WATCH }

  const { data: existing } = await supabase
    .from("admired_photos")
    .select("id")
    .eq("id", photo.id)
    .eq("user_id", userId)
    .maybeSingle()
  if (existing) return { photoId: photo.id, duplicate: true }

  const ext = photo.mediaType.split("/")[1] === "jpeg" ? "jpg" : (photo.mediaType.split("/")[1] ?? "jpg")
  const storagePath = isVendor
    ? `${userId}/admired/vendors/${owner.vendorId}/${photo.id}.${ext}`
    : `${userId}/admired/${owner.admiredId}/${photo.id}.${ext}`
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
    admired_id: isVendor ? null : owner.admiredId,
    vendor_id: isVendor ? owner.vendorId : null,
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

/** A watch's frame (watch / placard). */
export function storeAdmiredPhotoFor(
  supabase: SupabaseClient,
  userId: string,
  admiredId: string,
  photo: FrameInput
): Promise<{ photoId: string; duplicate: boolean } | { error: string }> {
  return storeFrameFor(supabase, userId, { admiredId }, photo)
}

/** A vendor's frame (booth / name). */
export function storeVendorPhotoFor(
  supabase: SupabaseClient,
  userId: string,
  vendorId: string,
  photo: FrameInput
): Promise<{ photoId: string; duplicate: boolean } | { error: string }> {
  return storeFrameFor(supabase, userId, { vendorId }, photo)
}

// ── Vendors (00060) ────────────────────────────────────────────────

export async function createVendorFor(
  supabase: SupabaseClient,
  userId: string,
  input: VendorFields & { id: string; seen_on: string }
): Promise<{ id: string } | { error: string }> {
  const name = input.name?.trim() || null
  const { error } = await supabase.from("admired_vendors").insert({
    id: input.id,
    user_id: userId,
    event: input.event ?? null,
    name,
    name_source: name ? "owner" : null,
    notes: input.notes ?? null,
    seen_on: input.seen_on,
  })
  // A retry of a create that already landed is success, not an error.
  if (error && !isDuplicate(error)) return { error: error.message }
  return { id: input.id }
}

/** A name typed by the owner always wins, and marks itself as theirs. */
export async function updateVendorFor(
  supabase: SupabaseClient,
  userId: string,
  id: string,
  fields: VendorFields
): Promise<{ ok: true } | { error: string }> {
  const patch: Record<string, unknown> = {}
  if (fields.name !== undefined) {
    patch.name = fields.name?.trim() || null
    patch.name_source = patch.name ? "owner" : null
  }
  if (fields.notes !== undefined) patch.notes = fields.notes || null
  if (fields.event !== undefined) patch.event = fields.event || null
  if (Object.keys(patch).length === 0) return { ok: true }
  const { error } = await supabase.from("admired_vendors").update(patch).eq("id", id).eq("user_id", userId)
  if (error) return { error: error.message }
  return { ok: true }
}

/** A vendor, its watches, and every stored frame of either. */
export async function deleteVendorFor(
  supabase: SupabaseClient,
  userId: string,
  id: string
): Promise<{ ok: true } | { error: string }> {
  const { data: watches } = await supabase
    .from("admired_watches")
    .select("id")
    .eq("vendor_id", id)
    .eq("user_id", userId)
  const watchIds = ((watches ?? []) as Array<{ id: string }>).map((w) => w.id)
  const owners = [`vendor_id.eq.${id}`, ...(watchIds.length ? [`admired_id.in.(${watchIds.join(",")})`] : [])]
  const { data: photos } = await supabase
    .from("admired_photos")
    .select("storage_path, thumb_path")
    .eq("user_id", userId)
    .or(owners.join(","))
  const paths = ((photos ?? []) as Array<{ storage_path: string; thumb_path: string | null }>).flatMap((p) => [
    p.storage_path,
    p.thumb_path ?? thumbPathFor(p.storage_path),
  ])
  if (paths.length) await supabase.storage.from(BUCKET).remove(paths)
  // Watches and frames go with it (ON DELETE CASCADE).
  const { error } = await supabase.from("admired_vendors").delete().eq("id", id).eq("user_id", userId)
  if (error) return { error: error.message }
  return { ok: true }
}

/**
 * Read a vendor's NAME frame and set the vendor's name — only if it is still
 * empty: a name the owner typed always wins. Printed extras go into notes,
 * again only if empty.
 */
export async function readVendorNameFor(
  supabase: SupabaseClient,
  userId: string,
  vendorId: string,
  imageBase64: string,
  mediaType: string
): Promise<NonNullable<AdmiredPhotoResponse["vendorName"]> | { error: string }> {
  const startedAt = Date.now()
  const r = await readImage(vendorNameReadSchema, VENDOR_NAME_PROMPT, imageBase64, mediaType)
  if ("error" in r) return r
  const read: VendorNameRead = r.parsed

  const { data: row } = await supabase
    .from("admired_vendors")
    .select("name, notes")
    .eq("id", vendorId)
    .eq("user_id", userId)
    .maybeSingle()
  const current = (row ?? {}) as { name?: string | null; notes?: string | null }
  const patch: Record<string, unknown> = { name_read_at: new Date().toISOString() }
  const name = read.legible ? read.name?.trim() : undefined
  const filled = !!name && !current.name?.trim()
  if (filled) {
    patch.name = name!.slice(0, 120)
    patch.name_source = "read"
  }
  const details = read.legible ? read.details?.trim() : undefined
  if (details && !current.notes?.trim()) patch.notes = details.slice(0, 2000)
  await supabase.from("admired_vendors").update(patch).eq("id", vendorId).eq("user_id", userId)

  await logRead(supabase, userId, "vendor-name-read", startedAt, r, filled, name || "not legible")
  return { read, filled, cost_usd: Math.round(r.costUsd * 1000) / 1000 }
}

/**
 * Move a frame: to another watch, or change what it is (a Watch frame that
 * was really the booth). The stored file stays where it is — the path is only
 * a key. A frame turned INTO a Name frame is read, as if it had been shot as one.
 */
export async function moveAdmiredPhotoFor(
  supabase: SupabaseClient,
  userId: string,
  photoId: string,
  move: AdmiredPhotoMove
): Promise<{ ok: true; vendorName?: AdmiredPhotoResponse["vendorName"]; vendorNameError?: string } | { error: string }> {
  const { data: photo } = await supabase
    .from("admired_photos")
    .select("kind, storage_path")
    .eq("id", photoId)
    .eq("user_id", userId)
    .maybeSingle()
  if (!photo) return { error: "Photo not found." }
  const before = photo as { kind: AdmiredPhotoKind; storage_path: string }

  const vendorKind = isVendorKind(move.kind)
  const { error } = await supabase
    .from("admired_photos")
    .update({
      kind: move.kind,
      admired_id: vendorKind ? null : move.admired_id,
      vendor_id: vendorKind ? move.vendor_id : null,
    })
    .eq("id", photoId)
    .eq("user_id", userId)
  if (error) return { error: error.message }

  if (move.kind !== "name" || before.kind === "name" || !move.vendor_id) return { ok: true }
  const { data: file } = await supabase.storage.from(BUCKET).download(before.storage_path)
  if (!file) return { ok: true, vendorNameError: "Couldn't load the frame to read it." }
  const base64 = Buffer.from(await file.arrayBuffer()).toString("base64")
  const read = await readVendorNameFor(supabase, userId, move.vendor_id, base64, file.type || "image/jpeg")
  return "error" in read ? { ok: true, vendorNameError: read.error } : { ok: true, vendorName: read }
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
  const startedAt = Date.now()
  const r = await readImage(placardReadSchema, PLACARD_PROMPT, imageBase64, mediaType)
  if ("error" in r) return r
  const read: PlacardRead = r.parsed

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

  await logRead(
    supabase,
    userId,
    "placard-read",
    startedAt,
    r,
    filled.length > 0,
    read.legible ? [read.maker, read.model].filter(Boolean).join(" ") || "legible, no name" : "not legible"
  )
  return { read, filled, cost_usd: Math.round(r.costUsd * 1000) / 1000 }
}

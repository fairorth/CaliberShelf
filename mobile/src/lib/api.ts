import type { IdentifyRequest, IdentifyResponse } from "@/lib/validations/identify"
import type { PhotoAngle } from "@/lib/types/watch"
import type { PhonePhotoUpload } from "@/lib/validations/photo-upload"
import type { PhoneAddWatch, PhoneAddWatchResponse } from "@/lib/validations/phone-watch"
import { API_BASE } from "./config"
import { accessToken } from "./supabase"

/**
 * Calls to the web app's /api routes, authenticated with the Supabase access
 * token (getRequestAuth on the server). Everything that needs a secret key or
 * server-side image work (thumbnails, the vision model) goes through here;
 * plain reads go straight to Supabase.
 */

async function authHeaders(): Promise<Record<string, string>> {
  const token = await accessToken()
  if (!token) throw new Error("You're signed out — sign in again.")
  return { Authorization: `Bearer ${token}` }
}

async function readError(res: Response): Promise<string> {
  const body = (await res.json().catch(() => null)) as { error?: string } | null
  return body?.error ?? `Request failed (${res.status}).`
}

/**
 * Upload one frame to a watch; returns the new watch_photos id. Sent as
 * base64 JSON: Expo's fetch rejects React Native's `{ uri, name, type }`
 * FormData parts (camera trial build 1 — "Unsupported FormDataPart
 * implementation"). Contract: src/lib/validations/photo-upload.ts.
 */
export async function uploadPhoto(
  watchId: string,
  imageBase64: string,
  angle: PhotoAngle | null
): Promise<string> {
  const body: PhonePhotoUpload = { image_base64: imageBase64, media_type: "image/jpeg", angle }
  const res = await fetch(`${API_BASE}/api/watches/${watchId}/photos`, {
    method: "POST",
    headers: { ...(await authHeaders()), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(await readError(res))
  const json = (await res.json()) as { photoId: string }
  return json.photoId
}

/** Undo: delete a frame just uploaded. */
export async function deletePhoto(photoId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/photos/${photoId}`, {
    method: "DELETE",
    headers: await authHeaders(),
  })
  if (!res.ok) throw new Error(await readError(res))
}

/** "Which watch is this?" — one photo against the whole collection. */
export async function identify(req: IdentifyRequest): Promise<IdentifyResponse> {
  const res = await fetch(`${API_BASE}/api/identify`, {
    method: "POST",
    headers: { ...(await authHeaders()), "Content-Type": "application/json" },
    body: JSON.stringify(req),
  })
  if (!res.ok) throw new Error(await readError(res))
  return (await res.json()) as IdentifyResponse
}

/** Add a watch (with its cover photo) — POST /api/watches, the web's quick add. */
export async function addWatch(body: PhoneAddWatch): Promise<PhoneAddWatchResponse> {
  const res = await fetch(`${API_BASE}/api/watches`, {
    method: "POST",
    headers: { ...(await authHeaders()), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(await readError(res))
  return (await res.json()) as PhoneAddWatchResponse
}

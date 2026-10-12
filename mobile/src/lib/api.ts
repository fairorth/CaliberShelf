import type { IdentifyRequest, IdentifyResponse } from "@/lib/validations/identify"
import type { PhotoAngle } from "@/lib/types/watch"
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

/** Upload one frame to a watch; returns the new watch_photos id. */
export async function uploadPhoto(
  watchId: string,
  fileUri: string,
  angle: PhotoAngle | null
): Promise<string> {
  const form = new FormData()
  // React Native's FormData takes a { uri, name, type } descriptor for files.
  form.append("photo", { uri: fileUri, name: "frame.jpg", type: "image/jpeg" } as unknown as Blob)
  if (angle) form.append("angle", angle)

  const res = await fetch(`${API_BASE}/api/watches/${watchId}/photos`, {
    method: "POST",
    headers: await authHeaders(),
    body: form,
  })
  if (!res.ok) throw new Error(await readError(res))
  const body = (await res.json()) as { photoId: string }
  return body.photoId
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

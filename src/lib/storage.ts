import { createClient } from "@/lib/supabase/server"

const BUCKET = "watch-photos"
const SIGNED_URL_EXPIRY = 3600 // 1 hour in seconds

/**
 * Build a storage path following convention: {user_id}/{watch_id}/{filename}
 */
export function buildStoragePath(
  userId: string,
  watchId: string,
  filename: string
): string {
  return `${userId}/${watchId}/${filename}`
}

/**
 * Generate a signed URL for a private photo.
 * Returns null if the URL cannot be created.
 */
export async function getSignedUrl(
  storagePath: string
): Promise<string | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_EXPIRY)

  if (error || !data) {
    console.error("Failed to create signed URL:", error?.message)
    return null
  }

  return data.signedUrl
}

/** Supabase Storage image transformation options (Pro plan). */
export interface ImageTransform {
  width?: number
  height?: number
  resize?: "cover" | "contain" | "fill"
  quality?: number
}

/**
 * Signed transform URLs, memoised per (path + transform).
 *
 * The batch signing API does not accept a transform, so a transformed cover
 * costs one round trip per photo — 160 of them to draw the collection, and
 * twice that once the table asks for a thumbnail size as well. The URLs are
 * deterministic for an hour, so signing them again on every render is pure
 * waste; caching turns the second and subsequent loads into no network at all.
 *
 * Held for half the expiry so a cached URL always has ~30 minutes of life left
 * when it is handed out — a URL must never expire in a page the user is still
 * looking at. Keyed by storage path, which is already scoped to the owning
 * user, so one user's URL can never be served to another.
 */
const signedUrlCache = new Map<string, { url: string; expiresAt: number }>()
const CACHE_TTL_MS = (SIGNED_URL_EXPIRY / 2) * 1000

function transformKey(path: string, t: ImageTransform): string {
  return `${path}|${t.width ?? ""}x${t.height ?? ""}|${t.resize ?? ""}|${t.quality ?? ""}`
}

export async function getTransformedSignedUrls(
  storagePaths: string[],
  transform: ImageTransform
): Promise<Map<string, string>> {
  if (storagePaths.length === 0) return new Map()

  const now = Date.now()
  const supabase = await createClient()
  const entries = await Promise.all(
    storagePaths.map(async (path) => {
      const key = transformKey(path, transform)
      const hit = signedUrlCache.get(key)
      if (hit && hit.expiresAt > now) return [path, hit.url] as const

      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(path, SIGNED_URL_EXPIRY, { transform })
      if (error || !data) return [path, null] as const
      signedUrlCache.set(key, { url: data.signedUrl, expiresAt: now + CACHE_TTL_MS })
      return [path, data.signedUrl] as const
    })
  )

  const urlMap = new Map<string, string>()
  for (const [path, url] of entries) {
    if (url) urlMap.set(path, url)
  }
  return urlMap
}

/**
 * Generate signed URLs for multiple photos in batch.
 * Returns a map from storage_path to signed URL.
 */
export async function getSignedUrls(
  storagePaths: string[]
): Promise<Map<string, string>> {
  if (storagePaths.length === 0) return new Map()

  const supabase = await createClient()
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(storagePaths, SIGNED_URL_EXPIRY)

  const urlMap = new Map<string, string>()

  if (error || !data) {
    console.error("Failed to create signed URLs:", error?.message)
    return urlMap
  }

  for (const item of data) {
    if (item.signedUrl && item.path) {
      urlMap.set(item.path, item.signedUrl)
    }
  }

  return urlMap
}

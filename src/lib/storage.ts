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

/**
 * How many signing requests are in flight at once.
 *
 * This used to be unbounded: `Promise.all` over every path, which on the home
 * page is ~350 photos and then ~350 again for the thumbnail size. Firing 700
 * concurrent requests at storage means a handful of them lose, and a lost
 * signature is not a cosmetic failure — a frame with no URL is skipped, and a
 * watch whose frames were all skipped drops out of the rotation entirely. The
 * symptom was a home-page count that read 121, then 118, then 112 across
 * reloads of the same unchanged collection.
 */
const SIGN_CONCURRENCY = 12
/** One retry: these failures are load-related, so a second ask usually wins. */
const SIGN_ATTEMPTS = 2

/** Run `fn` over `items` with at most `limit` in flight, preserving order. */
async function mapWithLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length)
  let next = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    for (;;) {
      const i = next++
      if (i >= items.length) return
      results[i] = await fn(items[i])
    }
  })
  await Promise.all(workers)
  return results
}

export async function getTransformedSignedUrls(
  storagePaths: string[],
  transform: ImageTransform
): Promise<Map<string, string>> {
  if (storagePaths.length === 0) return new Map()

  const now = Date.now()
  const supabase = await createClient()
  const entries = await mapWithLimit(
    storagePaths,
    SIGN_CONCURRENCY,
    async (path) => {
      const key = transformKey(path, transform)
      const hit = signedUrlCache.get(key)
      if (hit && hit.expiresAt > now) return [path, hit.url] as const

      for (let attempt = 1; attempt <= SIGN_ATTEMPTS; attempt++) {
        const { data, error } = await supabase.storage
          .from(BUCKET)
          .createSignedUrl(path, SIGNED_URL_EXPIRY, { transform })
        if (!error && data) {
          signedUrlCache.set(key, {
            url: data.signedUrl,
            expiresAt: now + CACHE_TTL_MS,
          })
          return [path, data.signedUrl] as const
        }
        if (attempt === SIGN_ATTEMPTS) {
          // Loud on the way out: a dropped signature silently removes a watch
          // from the home rotation, which is exactly the kind of disappearance
          // that is impossible to notice from the outside.
          console.error(
            `Signed URL failed after ${SIGN_ATTEMPTS} attempts: ${path}`,
            error?.message
          )
        }
      }
      return [path, null] as const
    }
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

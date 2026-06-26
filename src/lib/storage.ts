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
 * Generate signed URLs that resize images on the fly via Supabase's transform
 * endpoint (Pro feature). Signs each path individually since the batch API
 * doesn't accept a transform. Returns a map from storage_path to signed URL.
 */
export async function getTransformedSignedUrls(
  storagePaths: string[],
  transform: ImageTransform
): Promise<Map<string, string>> {
  if (storagePaths.length === 0) return new Map()

  const supabase = await createClient()
  const entries = await Promise.all(
    storagePaths.map(async (path) => {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(path, SIGNED_URL_EXPIRY, { transform })
      return [path, error || !data ? null : data.signedUrl] as const
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

import { createClient } from "@/lib/supabase/server"
import { getSignedUrls } from "@/lib/storage"
import type { InspirationImage, InspirationImageWithUrls } from "@/lib/types/inspiration"

/** All inspiration images, newest first, with signed thumb + full URLs. */
export async function getInspirationImages(): Promise<InspirationImageWithUrls[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("inspiration_images")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Failed to fetch inspiration images:", error.message)
    return []
  }

  const rows = (data as InspirationImage[]) ?? []
  if (rows.length === 0) return []

  const paths = new Set<string>()
  for (const r of rows) {
    paths.add(r.storage_path)
    if (r.thumb_path) paths.add(r.thumb_path)
  }
  const signed = await getSignedUrls([...paths])

  return rows.map((r) => ({
    ...r,
    thumb_url: signed.get(r.thumb_path ?? r.storage_path) ?? null,
    full_url: signed.get(r.storage_path) ?? null,
  }))
}

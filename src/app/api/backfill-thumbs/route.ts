import { createClient } from "@/lib/supabase/server"
import { makeThumbnailBuffer, thumbPathFor } from "@/lib/thumbnails"

const BUCKET = "watch-photos"
const BATCH = 8 // process this many per request to stay within time limits

/**
 * One-time (idempotent) backfill: generate thumbnails for the signed-in user's
 * existing photos that don't have one yet. Call repeatedly until remaining = 0.
 */
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 })

  const { data: photos, error: selectError } = await supabase
    .from("watch_photos")
    .select("id, storage_path")
    .eq("user_id", user.id)
    .is("thumb_path", null)
    .limit(BATCH)

  if (selectError) {
    return Response.json(
      { error: selectError.message, hint: "Has migration 00017 (thumb_path) been applied?" },
      { status: 500 }
    )
  }

  const { count: totalPhotos } = await supabase
    .from("watch_photos")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)

  let processed = 0
  let failed = 0

  for (const p of (photos ?? []) as Array<{ id: string; storage_path: string }>) {
    try {
      const { data: blob, error: dlErr } = await supabase.storage
        .from(BUCKET)
        .download(p.storage_path)
      if (dlErr || !blob) {
        failed++
        continue
      }
      const thumb = await makeThumbnailBuffer(await blob.arrayBuffer())
      const path = thumbPathFor(p.storage_path)
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, thumb, { contentType: "image/jpeg", upsert: true })
      if (upErr) {
        failed++
        continue
      }
      await supabase.from("watch_photos").update({ thumb_path: path }).eq("id", p.id)
      processed++
    } catch {
      failed++
    }
  }

  const { count: remaining } = await supabase
    .from("watch_photos")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("thumb_path", null)

  return Response.json({ processed, failed, remaining: remaining ?? 0, totalPhotos: totalPhotos ?? 0 })
}

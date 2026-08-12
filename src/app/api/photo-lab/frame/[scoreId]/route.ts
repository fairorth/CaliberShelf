import { promises as fs } from "fs"
import path from "path"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * Serve a scored capture-folder frame from local disk (Photo Lab Review, D1).
 * The scorer works on local files under profiles.watch_images_path, so this
 * route only works where those files live (the tether workstation) — exactly
 * like photo-score.mjs itself. Prefers the scorer's regenerable
 * `_previews/<hash16>.jpg`; `?full=1` serves the original when it's a JPEG.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ scoreId: string }> }
) {
  const { scoreId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return new NextResponse("Unauthorized", { status: 401 })

  const [{ data: score }, { data: profile }] = await Promise.all([
    supabase
      .from("watch_image_scores")
      .select("rel_path, content_hash, source_kind")
      .eq("id", scoreId)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase.from("profiles").select("watch_images_path").eq("id", user.id).maybeSingle(),
  ])

  const base = ((profile?.watch_images_path as string | null) ?? "").trim()
  if (!score || !base) return new NextResponse("Not found", { status: 404 })

  const row = score as { rel_path: string; content_hash: string; source_kind: string }
  const wantFull = new URL(request.url).searchParams.get("full") === "1"

  // rel_path is relative to the parent folder and starts with the watch
  // folder segment. Resolve carefully and refuse anything escaping the base.
  const baseAbs = path.resolve(base)
  const originalAbs = path.resolve(baseAbs, row.rel_path)
  const watchFolder = row.rel_path.split("/")[0] ?? ""
  const previewAbs = path.resolve(
    baseAbs,
    watchFolder,
    "_previews",
    `${row.content_hash.slice(0, 16)}.jpg`
  )
  for (const p of [originalAbs, previewAbs]) {
    if (!p.startsWith(baseAbs + path.sep)) {
      return new NextResponse("Not found", { status: 404 })
    }
  }

  const isJpeg = /\.jpe?g$/i.test(row.rel_path)

  // full=1 → the original JPEG at native resolution (browser-renderable);
  // otherwise the scorer's preview, falling back to the original JPEG.
  const candidates = wantFull && isJpeg
    ? [originalAbs, previewAbs]
    : isJpeg
      ? [previewAbs, originalAbs]
      : [previewAbs]

  for (const candidate of candidates) {
    try {
      const bytes = await fs.readFile(candidate)
      return new NextResponse(new Uint8Array(bytes), {
        headers: {
          "Content-Type": "image/jpeg",
          "Cache-Control": "private, max-age=3600",
        },
      })
    } catch {
      // try the next candidate
    }
  }

  return new NextResponse("Frame file not found on this machine", { status: 404 })
}

import type { Metadata } from "next"
import { getWatches } from "@/lib/queries/watches"
import { getWatchImagesPath } from "@/lib/queries/app-settings"
import { createClient } from "@/lib/supabase/server"
import { PhotoLabTabs } from "../_components/photo-lab-tabs"
import { SessionView, type SessionFrame } from "./_components/session-view"
import type { PhotoAngle, WatchImageScore } from "@/lib/types/watch"

export const metadata: Metadata = {
  title: "Photo Lab · Session | CaliberShelf",
}

export const dynamic = "force-dynamic"

const ANGLES: PhotoAngle[] = ["flat", "hero", "profile", "caseback", "macro"]

/** Photo Lab · Session — the shoot is the unit of work (D1). Context,
 *  checklist and the capture-folder path; the tether station and
 *  photo-score.mjs own the camera and the filesystem. */
export default async function PhotoLabSessionPage({
  searchParams,
}: {
  searchParams: Promise<{ watch?: string; angle?: string }>
}) {
  const [{ watch: watchId, angle }, watches, imagesPath] = await Promise.all([
    searchParams,
    getWatches(),
    getWatchImagesPath(),
  ])

  const owned = watches.filter((w) => !w.is_wishlist)
  const selected = watchId ? owned.find((w) => w.id === watchId) ?? null : null

  // Frames landed so far for the session watch (scored capture-folder rows,
  // newest first) + its photo angle coverage.
  let frames: SessionFrame[] = []
  let angleCounts: Record<PhotoAngle, number> = {
    flat: 0,
    hero: 0,
    profile: 0,
    caseback: 0,
    macro: 0,
  }
  if (selected) {
    const supabase = await createClient()
    const [scoresRes, photosRes] = await Promise.all([
      supabase
        .from("watch_image_scores")
        .select("id, rel_path, composite_score, angle_class, stack_role, review_state")
        .eq("watch_id", selected.id)
        .neq("stack_role", "source")
        .order("created_at", { ascending: false })
        .limit(60),
      supabase.from("watch_photos").select("angle").eq("watch_id", selected.id),
    ])
    frames = ((scoresRes.data ?? []) as Pick<
      WatchImageScore,
      "id" | "rel_path" | "composite_score" | "angle_class" | "stack_role" | "review_state"
    >[]) satisfies SessionFrame[]

    const photoRows = (photosRes.data ?? []) as { angle: PhotoAngle | null }[]
    angleCounts = { ...angleCounts }
    for (const p of photoRows) {
      if (p.angle) angleCounts[p.angle]++
    }
    for (const f of frames) {
      const map: Record<string, PhotoAngle> = {
        flat_dial_on: "flat",
        angled_hero: "hero",
        side_profile: "profile",
        caseback_clasp: "caseback",
        macro_detail: "macro",
      }
      const a = f.angle_class ? map[f.angle_class] : undefined
      if (a) angleCounts[a]++
    }
  }

  const presetAngle = ANGLES.includes(angle as PhotoAngle) ? (angle as PhotoAngle) : null

  return (
    <div className="space-y-5">
      <h1 className="font-display text-lg font-semibold tracking-tight">Photo Lab</h1>
      <PhotoLabTabs />
      <SessionView
        watches={owned.map((w) => ({
          id: w.id,
          brand: w.brand.name,
          model: w.model,
          nickname: w.nickname,
          coverUrl: w.cover_photo_url,
        }))}
        selected={
          selected
            ? {
                id: selected.id,
                brand: selected.brand.name,
                model: selected.model,
                nickname: selected.nickname,
                coverUrl: selected.cover_photo_url,
              }
            : null
        }
        imagesPath={imagesPath}
        frames={frames}
        angleCounts={angleCounts}
        presetAngle={presetAngle}
      />
    </div>
  )
}

import type { Metadata } from "next"
import { getWatches } from "@/lib/queries/watches"
import { inEditPool } from "@/lib/queries/keep"
import { normalizeDialColor } from "@/lib/collection-map"
import { EditHeader } from "@/components/edit-header"
import { RatingSession, type RateWatch } from "./_components/rating-session"

export const metadata: Metadata = {
  title: "Rate | TenTenLoupe",
}

export const dynamic = "force-dynamic"

/** Fisher–Yates. Random order so the first twenty watches do not set the
 *  scale for the other hundred and fifty. Shuffled on the server, once per
 *  visit, so the client never re-orders under you mid-session. */
function shuffle<T>(items: T[]): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default async function RatePage() {
  const watches = await getWatches()
  const pool: RateWatch[] = shuffle(
    watches
      .filter((w) => inEditPool(w) && w.sale_status === "owned")
      .map((w) => ({
        id: w.id,
        brand: w.brand?.name ?? "",
        model: w.model,
        nickname: w.nickname,
        photoUrl: w.cover_photo_url,
        category: w.category?.name ?? null,
        dial: normalizeDialColor(w.dial_color).label,
        sizeMm: w.case_diameter_mm,
        comingSoon: w.is_coming_soon,
        lastWorn: w.last_worn_date ?? null,
        attachment: w.attachment,
        replaceability: w.replaceability ?? null,
        sentimental: w.sentimental ?? false,
        decision: w.keep_decision ?? null,
      }))
  )

  return (
    <div className="space-y-5 pb-8">
      <EditHeader
        title="Rate"
        subtitle="One watch at a time, in random order. No prices on this screen — that is deliberate."
      />
      <RatingSession watches={pool} />
    </div>
  )
}

import type { Metadata } from "next"
import { getWatches } from "@/lib/queries/watches"
import { getBoxConfig } from "@/lib/queries/box-config"
import { inEditPool } from "@/lib/queries/keep"
import { boxLabel } from "@/lib/boxes"
import { EditHeader } from "@/components/edit-header"
import { SortGrid, type PileWatch } from "./_components/sort-grid"

export const metadata: Metadata = {
  title: "Sort | TenTenLoupe",
}

export const dynamic = "force-dynamic"

export default async function SortPage() {
  const [watches, boxConfig] = await Promise.all([getWatches(), getBoxConfig()])

  const pile: PileWatch[] = watches
    // Listed watches have already made the call; the grid is for the rest.
    .filter((w) => inEditPool(w) && w.sale_status === "owned")
    .map((w) => ({
      id: w.id,
      brand: w.brand?.name ?? "",
      model: w.model,
      nickname: w.nickname,
      thumbUrl: w.cover_thumb_url ?? w.cover_photo_url,
      box: w.box,
      boxLabel: w.box ? boxLabel(w.box, boxConfig.descriptions) : null,
      decision: w.keep_decision ?? null,
      sentimental: w.sentimental ?? false,
      comingSoon: w.is_coming_soon,
    }))
    .sort((a, b) => `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`))

  return (
    <div className="space-y-5 pb-8">
      <EditHeader
        title="Sort"
        subtitle="Record the floor piles. Click a watch, then K keep · M maybe · S sell · 0 clear. Arrow keys move."
      />
      <SortGrid watches={pile} />
    </div>
  )
}

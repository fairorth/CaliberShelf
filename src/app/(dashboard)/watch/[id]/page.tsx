import { notFound } from "next/navigation"
import { getWatchById } from "@/lib/queries/watches"
import { getLabelsForWatch } from "@/lib/queries/labels"
import { getCategories } from "@/lib/queries/categories"
import { getWearCountForWatch } from "@/lib/queries/wear-logs"
import { getTimegrapherRuns } from "@/lib/queries/timegrapher"
import { WatchDetailHeader } from "./_components/watch-detail-header"
import { PhotoGallery } from "./_components/photo-gallery"
import { PhotoUploader } from "./_components/photo-uploader"
import { WatchSpecs } from "./_components/watch-specs"
import { TimegrapherPanel } from "./_components/timegrapher-panel"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const watch = await getWatchById(id)
  if (!watch) return { title: "Watch Not Found | CaliberShelf" }
  return {
    title: `${watch.brand.name} ${watch.model} | CaliberShelf`,
  }
}

export default async function WatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [watch, labels, wearInfo, categories, timegrapherRuns] = await Promise.all([
    getWatchById(id),
    getLabelsForWatch(id),
    getWearCountForWatch(id),
    getCategories(),
    getTimegrapherRuns(id),
  ])

  if (!watch) {
    notFound()
  }

  // Look up the category for this watch
  const category = categories.find((c) => c.id === watch.category_id) ?? null

  // Convert Maps to plain objects for client component serialization
  const photoUrls: Record<string, string> = {}
  for (const [key, value] of watch.photo_urls) {
    photoUrls[key] = value
  }
  const fullPhotoUrls: Record<string, string> = {}
  for (const [key, value] of watch.full_photo_urls) {
    fullPhotoUrls[key] = value
  }

  return (
    <div className="space-y-6">
      <WatchDetailHeader watch={watch} labels={labels} wearInfo={wearInfo} />

      <div className="grid gap-6 lg:grid-cols-[420px_1fr] lg:items-start lg:gap-[26px]">
        {/* Left column: Photos */}
        <div className="space-y-4">
          <PhotoGallery
            photos={watch.watch_photos}
            photoUrls={photoUrls}
            fullPhotoUrls={fullPhotoUrls}
            watchId={watch.id}
          />
          <PhotoUploader watchId={watch.id} />
        </div>

        {/* Right column: Specs + Timegrapher */}
        <div className="space-y-6">
          <WatchSpecs watch={watch} category={category} labels={labels} />
          <TimegrapherPanel watchId={watch.id} runs={timegrapherRuns} />
        </div>
      </div>
    </div>
  )
}

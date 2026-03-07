import { notFound } from "next/navigation"
import { getWatchById } from "@/lib/queries/watches"
import { WatchDetailHeader } from "./_components/watch-detail-header"
import { PhotoGallery } from "./_components/photo-gallery"
import { PhotoUploader } from "./_components/photo-uploader"
import { WatchSpecs } from "./_components/watch-specs"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const watch = await getWatchById(id)
  if (!watch) return { title: "Watch Not Found | CaliberShelf" }
  return {
    title: `${watch.brand} ${watch.model} | CaliberShelf`,
  }
}

export default async function WatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const watch = await getWatchById(id)

  if (!watch) {
    notFound()
  }

  // Convert Map to plain object for client component serialization
  const photoUrls: Record<string, string> = {}
  for (const [key, value] of watch.photo_urls) {
    photoUrls[key] = value
  }

  return (
    <div className="space-y-6">
      <WatchDetailHeader watch={watch} />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Left column: Photos */}
        <div className="space-y-4">
          <PhotoGallery
            photos={watch.watch_photos}
            photoUrls={photoUrls}
            watchId={watch.id}
          />
          <PhotoUploader watchId={watch.id} />
        </div>

        {/* Right column: Specs */}
        <WatchSpecs watch={watch} />
      </div>
    </div>
  )
}

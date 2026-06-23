import { notFound } from "next/navigation"
import Link from "next/link"
import { getWatchById } from "@/lib/queries/watches"
import { getBrands } from "@/lib/queries/brands"
import { getMovements } from "@/lib/queries/movements"
import { getCategories } from "@/lib/queries/categories"
import { getLabels, getLabelsForWatch } from "@/lib/queries/labels"
import { WatchForm } from "@/components/watch-form"
import { PhotoGallery } from "../_components/photo-gallery"
import { PhotoUploader } from "../_components/photo-uploader"
import { DialFramingEditor } from "./_components/dial-framing-editor"
import { updateWatch } from "@/lib/actions/watch-actions"
import { Button } from "@/components/ui/button"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const watch = await getWatchById(id)
  if (!watch) return { title: "Watch Not Found | CaliberShelf" }
  return {
    title: `Edit ${watch.brand.name} ${watch.model} | CaliberShelf`,
  }
}

export default async function EditWatchPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [watch, brands, movements, categories, labels, watchLabels] = await Promise.all([
    getWatchById(id),
    getBrands(),
    getMovements(),
    getCategories(),
    getLabels(),
    getLabelsForWatch(id),
  ])

  if (!watch) {
    notFound()
  }

  // Bind the watchId to the update action
  const boundUpdateWatch = updateWatch.bind(null, watch.id)

  // Convert Map to plain object for client component serialization
  const photoUrls: Record<string, string> = {}
  for (const [key, value] of watch.photo_urls) {
    photoUrls[key] = value
  }

  // Resolve the cover photo's signed URL for the dial-framing editor
  const coverPhoto = watch.watch_photos.find((p) => p.is_cover)
  const coverPhotoUrl = coverPhoto ? photoUrls[coverPhoto.storage_path] ?? null : null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" render={<Link href={`/watch/${watch.id}`} />}>
          &larr; Back
        </Button>
        <h1 className="text-lg font-bold tracking-tight">
          Edit {watch.brand.name} {watch.model}
        </h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Left column: Sticky photo gallery */}
        <div className="md:self-start md:sticky md:top-[calc(3.5rem+1.5rem)]">
          <div className="space-y-4">
            <PhotoGallery
              photos={watch.watch_photos}
              photoUrls={photoUrls}
              watchId={watch.id}
            />
            <PhotoUploader watchId={watch.id} />
            <DialFramingEditor
              watchId={watch.id}
              coverPhotoUrl={coverPhotoUrl}
              initialFocalX={watch.dial_focal_x}
              initialFocalY={watch.dial_focal_y}
              initialZoom={watch.dial_zoom}
            />
          </div>
        </div>

        {/* Right column: Scrollable form */}
        <div>
          <WatchForm
            action={boundUpdateWatch}
            watch={watch}
            submitLabel="Save Changes"
            brands={brands}
            movements={movements}
            categories={categories}
            labels={labels}
            defaultLabelIds={watchLabels.map((l) => l.id)}
          />
        </div>
      </div>
    </div>
  )
}

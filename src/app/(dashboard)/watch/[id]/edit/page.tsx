import { notFound } from "next/navigation"
import { getWatchById } from "@/lib/queries/watches"
import { getBrands } from "@/lib/queries/brands"
import { getMovements } from "@/lib/queries/movements"
import { getBoxConfig } from "@/lib/queries/box-config"
import { getCategories } from "@/lib/queries/categories"
import { getLabels, getLabelsForWatch } from "@/lib/queries/labels"
import { getWearCountForWatch } from "@/lib/queries/wear-logs"
import { getTimegrapherRuns } from "@/lib/queries/timegrapher"
import { getValuationsForWatch } from "@/lib/queries/valuations"
import { getStraps } from "@/lib/queries/straps"
import { strapMaterialLabels } from "@/lib/validations/strap"
import { strapDisplayName } from "@/lib/types/strap"
import { WatchForm } from "@/components/watch-form"
import { PhotoGallery } from "../_components/photo-gallery"
import { PhotoUploader } from "../_components/photo-uploader"
import { TimegrapherPanel } from "../_components/timegrapher-panel"
import { ValuationPanel } from "../_components/valuation-panel"
import { WearTodayButton } from "../_components/wear-today-button"
import { DialFramingEditor } from "./_components/dial-framing-editor"
import { StrapPanel } from "../_components/strap-panel"
import { updateWatch } from "@/lib/actions/watch-actions"

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
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ from?: string }>
}) {
  const { id } = await params
  const { from } = await searchParams
  // Where "Save"/"Cancel" return to. Known entry points map to safe internal
  // paths (never a raw URL — that would be an open redirect); everything else
  // falls back to the collection.
  const RETURN_TARGETS: Record<string, string> = {
    attention: "/reports/attention-needed",
    box: "/reports/box",
    category: "/reports/by-category",
    "brand-wishlist": "/reports/brand-wishlist",
    guides: "/guides",
  }
  const returnTo = RETURN_TARGETS[from ?? ""] ?? "/collection"

  const [watch, brands, movements, categories, labels, watchLabels, wearInfo, timegrapherRuns, valuations, boxConfig, straps] =
    await Promise.all([
      getWatchById(id),
      getBrands(),
      getMovements(),
      getCategories(),
      getLabels(),
      getLabelsForWatch(id),
      getWearCountForWatch(id),
      getTimegrapherRuns(id),
      getValuationsForWatch(id),
      getBoxConfig(),
      getStraps(),
    ])

  if (!watch) {
    notFound()
  }

  // Bind the watchId to the update action
  const boundUpdateWatch = updateWatch.bind(null, watch.id, returnTo)

  // Convert Maps to plain objects for client component serialization
  const photoUrls: Record<string, string> = {}
  for (const [key, value] of watch.photo_urls) {
    photoUrls[key] = value
  }
  const fullPhotoUrls: Record<string, string> = {}
  for (const [key, value] of watch.full_photo_urls) {
    fullPhotoUrls[key] = value
  }

  // Resolve the cover photo's signed URL for the dial-framing editor
  const coverPhoto = watch.watch_photos.find((p) => p.is_cover)
  const coverPhotoUrl = coverPhoto ? photoUrls[coverPhoto.storage_path] ?? null : null

  // Display names for the strap panel (computed server-side; the panel is a
  // client component and shouldn't need the material label map).
  const strapLabels: Record<string, string> = {}
  for (const s of straps) {
    strapLabels[s.id] = strapDisplayName(s, strapMaterialLabels[s.material])
  }

  return (
    <div className="space-y-6 pb-28">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="font-display text-lg font-semibold tracking-tight">
          {watch.brand.name}{" "}
          <span className="text-muted-foreground">{watch.nickname || watch.model}</span>
        </h1>
        <WearTodayButton watchId={watch.id} wearInfo={wearInfo} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[420px_1fr] lg:items-start lg:gap-[26px]">
        {/* Left column: Sticky photo gallery */}
        <div className="lg:self-start lg:sticky lg:top-[calc(3.5rem+1.5rem)]">
          <div className="space-y-4">
            <PhotoGallery
              photos={watch.watch_photos}
              photoUrls={photoUrls}
              fullPhotoUrls={fullPhotoUrls}
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
            <StrapPanel
              watchId={watch.id}
              watchStrapWidthMm={watch.strap_width_mm}
              straps={straps}
              strapLabels={strapLabels}
            />
          </div>
        </div>

        {/* Right column: Scrollable form + timegrapher */}
        <div className="space-y-6">
          <WatchForm
            action={boundUpdateWatch}
            watch={watch}
            submitLabel="Save Changes"
            brands={brands}
            movements={movements}
            categories={categories}
            labels={labels}
            boxCount={boxConfig.count}
            boxDescriptions={boxConfig.descriptions}
            defaultLabelIds={watchLabels.map((l) => l.id)}
            stickyBar
            cancelHref={returnTo}
          />
          <ValuationPanel
            valuations={valuations}
            purchasePriceCents={watch.purchase_price_cents}
          />
          <TimegrapherPanel
            watchId={watch.id}
            runs={timegrapherRuns}
            liftAngle={watch.movement?.lift_angle ?? null}
            caliberName={watch.movement?.caliber_name ?? null}
          />
        </div>
      </div>
    </div>
  )
}

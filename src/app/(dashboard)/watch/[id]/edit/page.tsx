import { notFound } from "next/navigation"
import { getWatchById } from "@/lib/queries/watches"
import { getBrands } from "@/lib/queries/brands"
import { getMovements } from "@/lib/queries/movements"
import { getBoxConfig } from "@/lib/queries/box-config"
import { getCategories } from "@/lib/queries/categories"
import { getLabels, getLabelsForWatch } from "@/lib/queries/labels"
import { getTimegrapherRuns } from "@/lib/queries/timegrapher"
import { getStraps } from "@/lib/queries/straps"
import { strapMaterialLabels } from "@/lib/validations/strap"
import { strapDisplayName } from "@/lib/types/strap"
import { WatchForm } from "@/components/watch-form"
import { PhotoGallery } from "../_components/photo-gallery"
import { PhotoUploader } from "../_components/photo-uploader"
import { TimegrapherPanel } from "../_components/timegrapher-panel"
import { StrapPanel } from "../_components/strap-panel"
import { FormJumpList } from "./_components/form-jump-list"
import { updateWatch } from "@/lib/actions/watch-actions"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const watch = await getWatchById(id)
  if (!watch) return { title: "Watch Not Found | TenTenLoupe" }
  return {
    title: `Edit ${watch.brand.name} ${watch.model} | TenTenLoupe`,
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
    watch: `/watch/${id}`,
    attention: "/reports/attention-needed",
    box: "/reports/box",
    category: "/reports/by-category",
    "brand-wishlist": "/reports/brand-wishlist",
    guides: "/guides",
  }
  const returnTo = RETURN_TARGETS[from ?? ""] ?? "/collection"

  // No wear count here any more (§3.1) — one fewer query, too.
  const [watch, brands, movements, categories, labels, watchLabels, timegrapherRuns, boxConfig, straps] =
    await Promise.all([
      getWatchById(id),
      getBrands(),
      getMovements(),
      getCategories(),
      getLabels(),
      getLabelsForWatch(id),
      getTimegrapherRuns(id),
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
        {/* §3.1 — `Wore Today` and the wear count are gone from the edit
            page. Logging a wear is a mutation on a DIFFERENT record, fired
            from inside a form with unsaved changes and a manual save: pressing
            it while dirty asks a question with no good answer (does the edit
            save, get discarded, or half-persist?). Both live on the view page,
            where an action that is not editing belongs. */}
      </div>

      <div className="grid gap-6 lg:grid-cols-[420px_1fr] lg:items-start lg:gap-[26px]">
        {/* Left column: sticky photo column + section nav (§3.6) */}
        <div className="lg:self-start lg:sticky lg:top-[calc(3.5rem+1.5rem)]">
          <div className="space-y-4" id="photos">
            <FormJumpList />
            <PhotoGallery
              photos={watch.watch_photos}
              photoUrls={photoUrls}
              fullPhotoUrls={fullPhotoUrls}
              watchId={watch.id}
            />
            <PhotoUploader watchId={watch.id} />
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
          <div id="timegrapher">
          <TimegrapherPanel
            watchId={watch.id}
            runs={timegrapherRuns}
            liftAngle={watch.movement?.lift_angle ?? null}
            caliberName={watch.movement?.caliber_name ?? null}
          />
          </div>
        </div>
      </div>
    </div>
  )
}

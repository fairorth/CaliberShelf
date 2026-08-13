import type { Metadata } from "next"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { getBrands } from "@/lib/queries/brands"
import { getWatches } from "@/lib/queries/watches"
import {
  getChronoscoutBrandByName,
  getChronoscoutModelsForBrand,
  type ChronoscoutBrand,
  type ChronoscoutModel,
} from "@/lib/queries/chronoscout"
import { formatCurrency } from "@/lib/utils"
import { CollapsibleReportGroup } from "@/components/collapsible-report-group"
import { brandTypeLabels } from "@/lib/validations/brand"
import type { Brand, WatchWithCover } from "@/lib/types/watch"

export const metadata: Metadata = {
  title: "Brand Wish List | TenTenLoupe",
}

export const dynamic = "force-dynamic"

const FIT_MODEL_COUNT = 6

interface EnrichedBrand {
  brand: Brand
  wishlistWatches: WatchWithCover[]
  catalog: ChronoscoutBrand | null
  fitModels: ChronoscoutModel[]
  catalogModelCount: number
}

function median(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

/** Rank catalog models by closeness to the collection's typical dimensions. */
function rankByFit(
  models: ChronoscoutModel[],
  medDiameter: number | null,
  medThickness: number | null
): ChronoscoutModel[] {
  if (medDiameter == null) return models.slice(0, FIT_MODEL_COUNT)
  return models
    .filter((m) => m.diameter_mm != null)
    .map((m) => {
      let score = Math.abs((m.diameter_mm as number) - medDiameter)
      if (medThickness != null && m.thickness_mm != null) {
        score += 0.4 * Math.abs(m.thickness_mm - medThickness)
      }
      return { m, score }
    })
    .sort((a, b) => a.score - b.score)
    .slice(0, FIT_MODEL_COUNT)
    .map((x) => x.m)
}

export default async function BrandWishlistPage() {
  const [brands, watches] = await Promise.all([getBrands(), getWatches()])
  const wishlistBrands = brands.filter((b) => b.is_wishlist)

  // Collection size profile from OWNED watches (wish-list ones excluded) —
  // drives the "closest to your collection" catalog ranking.
  const owned = watches.filter((w) => !w.is_wishlist)
  const medDiameter = median(
    owned.map((w) => w.case_diameter_mm).filter((v): v is number => v != null)
  )
  const medThickness = median(
    owned.map((w) => w.case_height_mm).filter((v): v is number => v != null)
  )

  // Enrich each wish-list brand from the ChronoScout mirror (free, local).
  const enriched: EnrichedBrand[] = await Promise.all(
    wishlistBrands.map(async (brand) => {
      const wishlistWatches = watches.filter(
        (w) => w.is_wishlist && w.brand_id === brand.id
      )
      const catalog = await getChronoscoutBrandByName(brand.name)
      if (!catalog) {
        return { brand, wishlistWatches, catalog: null, fitModels: [], catalogModelCount: 0 }
      }
      const { models, totalCount } = await getChronoscoutModelsForBrand(catalog.id)
      return {
        brand,
        wishlistWatches,
        catalog,
        fitModels: rankByFit(models, medDiameter, medThickness),
        catalogModelCount: totalCount,
      }
    })
  )

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/reports"
          className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ‹ Reports
        </Link>
        <h1 className="font-display text-lg font-semibold tracking-tight">Brand Wish List</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {wishlistBrands.length === 0 ? (
            <>No wish-list brands.</>
          ) : (
            <>
              {wishlistBrands.length} {wishlistBrands.length === 1 ? "brand" : "brands"} you
              want but don&apos;t own from yet.
            </>
          )}{" "}
          Tag brands on the{" "}
          <Link href="/brands" className="text-primary underline-offset-2 hover:underline">
            Brands
          </Link>{" "}
          page; the tag clears itself when you add an owned or incoming watch from the brand.
        </p>
      </div>

      {wishlistBrands.length === 0 ? (
        <Card className="max-w-2xl">
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Tick &ldquo;Wish list&rdquo; when adding or editing a brand on the{" "}
            <Link href="/brands" className="text-primary underline-offset-2 hover:underline">
              Brands
            </Link>{" "}page{" "}
            and it will show up here with ChronoScout catalog context.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {enriched.map(({ brand, wishlistWatches, catalog, fitModels, catalogModelCount }) => (
            <CollapsibleReportGroup
              key={brand.id}
              title={brand.name}
              titleHref="/brands"
              summary={
                <>
                  {brand.brand_type ? `${brandTypeLabels[brand.brand_type]} · ` : ""}
                  {brand.country_of_origin ? `${brand.country_of_origin} · ` : ""}
                  {wishlistWatches.length > 0 && (
                    <>
                      {wishlistWatches.length} wish-list{" "}
                      {wishlistWatches.length === 1 ? "watch" : "watches"} ·{" "}
                    </>
                  )}
                  {catalog
                    ? `${catalogModelCount} catalog ${catalogModelCount === 1 ? "model" : "models"}`
                    : "not in ChronoScout catalog"}
                </>
              }
            >
              <div className="space-y-4 px-6 py-4">
                {/* Your wish-list watches from this brand */}
                {wishlistWatches.length > 0 && (
                  <div>
                    <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      On your wish list
                    </h3>
                    <ul className="divide-y divide-border/50">
                      {wishlistWatches.map((w) => (
                        <li key={w.id}>
                          <Link
                            href={`/watch/${w.id}/edit?from=brand-wishlist`}
                            className="group flex items-center justify-between gap-3 py-1.5 text-sm hover:bg-accent/40"
                          >
                            <span className="min-w-0 truncate font-medium group-hover:text-primary">
                              {w.model}
                              {w.nickname && (
                                <span className="ml-2 text-xs font-normal text-muted-foreground">
                                  {w.nickname}
                                </span>
                              )}
                            </span>
                            <span className="shrink-0 font-mono text-muted-foreground">
                              {w.purchase_price_cents != null
                                ? formatCurrency(w.purchase_price_cents, "USD", true)
                                : "—"}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {catalog ? (
                  <>
                    {/* ChronoScout brand snapshot */}
                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                      {catalog.price_min_cents != null && catalog.price_max_cents != null && (
                        <span>
                          <span className="text-muted-foreground">Price range </span>
                          <span className="font-mono tabular-nums text-foreground">
                            {formatCurrency(catalog.price_min_cents, "USD", true)}–
                            {formatCurrency(catalog.price_max_cents, "USD", true)}
                          </span>
                        </span>
                      )}
                      {catalog.styles && catalog.styles.length > 0 && (
                        <span>
                          <span className="text-muted-foreground">Styles </span>
                          {catalog.styles.slice(0, 5).join(", ")}
                        </span>
                      )}
                      {catalog.movement_types && catalog.movement_types.length > 0 && (
                        <span>
                          <span className="text-muted-foreground">Movements </span>
                          {catalog.movement_types.slice(0, 4).join(", ")}
                        </span>
                      )}
                      {catalog.case_sizes_mm && catalog.case_sizes_mm.length > 0 && (
                        <span>
                          <span className="text-muted-foreground">Case sizes </span>
                          {Math.min(...catalog.case_sizes_mm)}–{Math.max(...catalog.case_sizes_mm)}mm
                        </span>
                      )}
                    </div>

                    {/* Catalog models closest to the collection's typical size */}
                    {fitModels.length > 0 && (
                      <div>
                        <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {medDiameter != null
                            ? `Closest to your collection (typical ${medDiameter}mm)`
                            : "From the catalog"}
                        </h3>
                        <ul className="divide-y divide-border/50">
                          {fitModels.map((m) => (
                            <li key={m.id} className="flex items-center gap-3 py-1.5 text-sm">
                              {m.image_src ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={m.image_src}
                                  alt=""
                                  loading="lazy"
                                  className="h-9 w-9 shrink-0 rounded-md border border-border/50 object-cover"
                                />
                              ) : (
                                <span className="h-9 w-9 shrink-0 rounded-md border border-border/50 bg-muted" />
                              )}
                              <span className="min-w-0 flex-1 truncate">
                                {m.chronoscout_url ? (
                                  <a
                                    href={m.chronoscout_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-medium underline-offset-2 hover:text-primary hover:underline"
                                  >
                                    {m.name}
                                  </a>
                                ) : (
                                  <span className="font-medium">{m.name}</span>
                                )}
                              </span>
                              <span className="shrink-0 font-mono text-xs text-muted-foreground">
                                {m.diameter_mm != null ? `${m.diameter_mm}mm` : "—"}
                                {m.thickness_mm != null ? ` × ${m.thickness_mm}mm` : ""}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <p className="text-2xs text-muted-foreground">
                      Catalog data from{" "}
                      {catalog.chronoscout_url ? (
                        <a
                          href={catalog.chronoscout_url}
                          target="_blank"
                          rel="noreferrer"
                          className="underline-offset-2 hover:underline"
                        >
                          ChronoScout
                        </a>
                      ) : (
                        "ChronoScout"
                      )}
                      {catalog.most_recent_watch_added_at && (
                        <>
                          {" "}· latest catalog addition{" "}
                          {new Date(catalog.most_recent_watch_added_at).toLocaleDateString()}
                        </>
                      )}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No ChronoScout catalog entry matched &ldquo;{brand.name}&rdquo; — spelling
                    differences count, so check the brand name if you expected a match.
                  </p>
                )}
              </div>
            </CollapsibleReportGroup>
          ))}
        </div>
      )}
    </div>
  )
}

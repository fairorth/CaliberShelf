import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ChevronRight,
  Pencil,
  Receipt,
  Settings2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { getWatchById } from "@/lib/queries/watches"
import { getWearCountForWatch } from "@/lib/queries/wear-logs"
import { getValuationsForWatch } from "@/lib/queries/valuations"
import { getTimegrapherRuns } from "@/lib/queries/timegrapher"
import { getCurrentStrapForWatch } from "@/lib/queries/straps"
import { getBoxConfig } from "@/lib/queries/box-config"
import { boxLabel } from "@/lib/boxes"
import { formatCurrency } from "@/lib/utils"
import {
  caseMaterialLabels,
  crystalLabels,
  caseShapeLabels,
} from "@/lib/validations/watch"
import { caliberTypeLabels } from "@/lib/validations/movement"
import { strapMaterialLabels } from "@/lib/validations/strap"
import { strapDisplayName } from "@/lib/types/strap"
import { WatchViewPhotos } from "./_components/watch-view-photos"
import { WearTodayButton } from "./_components/wear-today-button"
import { CollectionBackLink } from "./_components/collection-back-link"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const watch = await getWatchById(id)
  if (!watch) return { title: "Watch Not Found | CaliberShelf" }
  return { title: `${watch.brand.name} ${watch.model} | CaliberShelf` }
}

function formatDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function daysAgo(iso: string): number {
  return Math.max(
    0,
    Math.floor((Date.now() - new Date(iso + "T00:00:00").getTime()) / 86400000)
  )
}

/** Label/value spec row — omit the row entirely when the value is null (A1). */
function SpecRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border/60 py-[9px] last:border-b-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-right font-mono text-xs text-foreground">{children}</span>
    </div>
  )
}

function SpecCard({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: "true" }>
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center gap-2.5 border-b border-border px-4 py-3.5">
        <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <h2 className="font-display text-md font-semibold">{title}</h2>
      </div>
      <div className="px-4 py-2">{children}</div>
    </div>
  )
}

/** One of the linked stat strips below the body (A1). */
function Strip({
  href,
  eyebrow,
  value,
  valueSuffix,
  context,
}: {
  href: string
  eyebrow: string
  value: string
  valueSuffix?: React.ReactNode
  context: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-3 rounded-xl border border-border bg-card px-[18px] py-4 transition-colors hover:border-brass/50"
    >
      <span className="flex items-center justify-between font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground">
        {eyebrow}
        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
      <span className="flex items-baseline gap-2">
        <span className="font-mono text-lg tabular-nums text-foreground">{value}</span>
        {valueSuffix && <span className="text-xs">{valueSuffix}</span>}
      </span>
      <span className="text-xs text-muted-foreground">{context}</span>
    </Link>
  )
}

export default async function WatchViewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [watch, wearInfo, valuations, timegrapherRuns, currentStrap, boxConfig] =
    await Promise.all([
      getWatchById(id),
      getWearCountForWatch(id),
      getValuationsForWatch(id),
      getTimegrapherRuns(id),
      getCurrentStrapForWatch(id),
      getBoxConfig(),
    ])

  if (!watch) notFound()

  const photoUrls: Record<string, string> = {}
  for (const [key, value] of watch.photo_urls) photoUrls[key] = value
  const fullPhotoUrls: Record<string, string> = {}
  for (const [key, value] of watch.full_photo_urls) fullPhotoUrls[key] = value

  const status = watch.is_wishlist
    ? "WISH LIST"
    : watch.is_coming_soon
      ? "COMING SOON"
      : "OWNED"

  const movement = watch.movement
  const movementLine = movement
    ? [
        `${movement.manufacturer ? movement.manufacturer + " " : ""}${movement.caliber_name}`.trim(),
        movement.caliber_type
          ? caliberTypeLabels[movement.caliber_type] ?? movement.caliber_type
          : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : null

  const complications = (watch.complication ?? "")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean)

  const measurements: { label: string; value: string | null }[] = [
    { label: "Diameter", value: watch.case_diameter_mm ? `${watch.case_diameter_mm} mm` : null },
    { label: "Height", value: watch.case_height_mm ? `${watch.case_height_mm} mm` : null },
    { label: "Lug-to-lug", value: watch.lug_to_lug_mm ? `${watch.lug_to_lug_mm} mm` : null },
    { label: "Lug width", value: watch.strap_width_mm ? `${watch.strap_width_mm} mm` : null },
    { label: "Weight", value: watch.weight_g ? `${watch.weight_g} g` : null },
    {
      label: "Water res.",
      value: watch.water_resistance_m != null ? `${watch.water_resistance_m} m` : null,
    },
  ].filter((m) => m.value !== null)

  const latestValuation = valuations[0]
  const valuationDeltaPct =
    latestValuation && watch.purchase_price_cents
      ? ((latestValuation.value_mid_cents - watch.purchase_price_cents) /
          watch.purchase_price_cents) *
        100
      : null

  const latestRun = timegrapherRuns[0]

  return (
    <div className="mx-auto max-w-[1180px] space-y-5 pb-8">
      {/* Back link — returns to the collection as it was left (filters + search). */}
      <CollectionBackLink />

      {/* Title row */}
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0 space-y-2">
          <h1 className="font-display text-lg font-semibold tracking-tight">
            {watch.brand.name}{" "}
            <span className="font-normal text-muted-foreground">
              {watch.model}
              {watch.nickname ? ` “${watch.nickname}”` : ""}
            </span>
          </h1>
          {/* Meta row — status is data, never brass (A1). */}
          <div className="flex flex-wrap items-center gap-3">
            {watch.reference_number && (
              <span className="font-mono text-xs text-muted-foreground">
                {watch.reference_number}
              </span>
            )}
            {watch.reference_number && (
              <span className="h-3 w-px bg-border" aria-hidden="true" />
            )}
            <span className="rounded-full bg-muted px-[9px] py-[3px] font-mono text-2xs uppercase tracking-[0.1em] text-foreground">
              {status}
            </span>
            {watch.box && (
              <span className="rounded-full bg-primary/14 px-[9px] py-[3px] font-mono text-2xs uppercase tracking-[0.1em] text-primary">
                {watch.box}
              </span>
            )}
            {watch.price_check_enabled && (
              <span className="rounded-full bg-primary/14 px-[9px] py-[3px] font-mono text-2xs uppercase tracking-[0.1em] text-primary">
                Price tracked
              </span>
            )}
          </div>
        </div>

        {/* Actions — Edit is the only primary action; Delete lives on the
            edit page only (A1). */}
        <div className="flex shrink-0 items-center gap-2.5">
          {!watch.is_wishlist && <WearTodayButton watchId={watch.id} wearInfo={wearInfo} />}
          <Button
            render={<Link href={`/watch/${watch.id}/edit?from=watch`} />}
            className="gap-1.5 bg-brass text-brass-foreground hover:bg-brass/90"
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
            Edit
          </Button>
        </div>
      </div>

      {/* Body: photos + spec rail */}
      <div className="grid items-start gap-[22px] lg:grid-cols-[1fr_380px]">
        <WatchViewPhotos
          photos={watch.watch_photos}
          photoUrls={photoUrls}
          fullPhotoUrls={fullPhotoUrls}
          watchId={watch.id}
        />

        <div className="space-y-3.5">
          <SpecCard title="Specifications" icon={Settings2}>
            {watch.category && <SpecRow label="Category">{watch.category.name}</SpecRow>}
            {movementLine && <SpecRow label="Movement">{movementLine}</SpecRow>}
            {watch.case_material && (
              <SpecRow label="Case material">
                {caseMaterialLabels[watch.case_material] ?? watch.case_material}
              </SpecRow>
            )}
            {watch.crystal && (
              <SpecRow label="Crystal">
                {crystalLabels[watch.crystal] ?? watch.crystal}
              </SpecRow>
            )}
            {watch.case_shape && (
              <SpecRow label="Case shape">
                {caseShapeLabels[watch.case_shape] ?? watch.case_shape}
              </SpecRow>
            )}
            {watch.dial_color && <SpecRow label="Dial">{watch.dial_color}</SpecRow>}
            {measurements.length > 0 && (
              <div className="grid grid-cols-2 gap-x-[18px]">
                {measurements.map((m) => (
                  <SpecRow key={m.label} label={m.label}>
                    <span className="tabular-nums">{m.value}</span>
                  </SpecRow>
                ))}
              </div>
            )}
            {complications.length > 0 && (
              <div className="flex items-baseline justify-between gap-4 py-[9px]">
                <span className="text-xs text-muted-foreground">Complications</span>
                <span className="flex flex-wrap justify-end gap-1.5">
                  {complications.map((c) => (
                    <span
                      key={c}
                      className="rounded-full bg-muted px-2 py-0.5 font-mono text-2xs text-foreground"
                    >
                      {c}
                    </span>
                  ))}
                </span>
              </div>
            )}
          </SpecCard>

          <SpecCard title="Ownership" icon={Receipt}>
            {watch.purchase_date && (
              <SpecRow label="Purchased">{watch.purchase_date}</SpecRow>
            )}
            {watch.purchase_price_cents != null && (
              <SpecRow label={watch.is_wishlist ? "Est. cost" : "Paid"}>
                <span className="tabular-nums">
                  {formatCurrency(watch.purchase_price_cents, watch.purchase_currency)}
                </span>
              </SpecRow>
            )}
            {watch.box && (
              <SpecRow label="Stored in">
                {boxLabel(watch.box, boxConfig.descriptions)}
              </SpecRow>
            )}
            {watch.notes && (
              <div className="py-[9px]">
                <span className="text-xs text-muted-foreground">Notes</span>
                <p className="mt-1 whitespace-pre-wrap text-xs text-foreground">
                  {watch.notes}
                </p>
              </div>
            )}
          </SpecCard>
        </div>
      </div>

      {/* Strips — each renders an empty state rather than disappearing (A1). */}
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {!watch.is_wishlist && (
          <Strip
            href="/wear-log"
            eyebrow="Wear"
            value={String(wearInfo.count)}
            valueSuffix={<span className="text-muted-foreground">wears</span>}
            context={
              wearInfo.lastWorn ? (
                <>
                  Last worn{" "}
                  <span className="text-foreground">{formatDate(wearInfo.lastWorn)}</span> ·{" "}
                  {daysAgo(wearInfo.lastWorn)} days ago
                </>
              ) : (
                "Not yet worn · log the first wear"
              )
            }
          />
        )}
        <Strip
          href="/reports/valuations"
          eyebrow="Market value"
          value={
            latestValuation
              ? formatCurrency(latestValuation.value_mid_cents, latestValuation.currency, true)
              : "—"
          }
          valueSuffix={
            valuationDeltaPct != null ? (
              <span className={valuationDeltaPct >= 0 ? "text-chart-2" : "text-destructive"}>
                {valuationDeltaPct >= 0 ? "+" : ""}
                {valuationDeltaPct.toFixed(1)}%
              </span>
            ) : undefined
          }
          context={
            latestValuation ? (
              <>
                <span className="text-foreground">
                  {formatDate(latestValuation.valued_at.slice(0, 10))}
                </span>{" "}
                · {latestValuation.confidence} confidence
              </>
            ) : (
              "No valuations yet · enable price checking"
            )
          }
        />
        <Strip
          href={`/watch/${watch.id}/edit?from=watch`}
          eyebrow="Timegrapher"
          value={
            latestRun?.rate_sec_per_day != null
              ? `${latestRun.rate_sec_per_day > 0 ? "+" : ""}${latestRun.rate_sec_per_day} s/d`
              : "—"
          }
          context={
            latestRun ? (
              <>
                <span className="text-foreground">{formatDate(latestRun.run_date)}</span>
                {movement?.lift_angle ? ` · lift angle ${movement.lift_angle}°` : ""}
              </>
            ) : (
              "No runs yet · record one on the edit page"
            )
          }
        />
        {currentStrap && (
          <Strip
            href="/straps"
            eyebrow="Strap"
            value={`${currentStrap.width_mm}mm`}
            context={
              <span className="text-foreground">
                {strapDisplayName(currentStrap, strapMaterialLabels[currentStrap.material])}
              </span>
            }
          />
        )}
      </div>
    </div>
  )
}

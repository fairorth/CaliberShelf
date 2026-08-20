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
import { getActiveListing, getSaleForWatch } from "@/lib/queries/sales"
import { gainVersusBasis } from "@/lib/queries/portfolio"
import { GainValue } from "@/components/gain-value"
import { getTimegrapherRuns } from "@/lib/queries/timegrapher"
import { getCurrentStrapForWatch } from "@/lib/queries/straps"
import { getBoxConfig } from "@/lib/queries/box-config"
import { boxLabel } from "@/lib/boxes"
import { cn, formatCurrency } from "@/lib/utils"
import {
  caseMaterialLabels,
  crystalLabels,
  caseShapeLabels,
} from "@/lib/validations/watch"
import { caliberTypeLabels } from "@/lib/validations/movement"
import { caliberLabel } from "@/lib/caliber"
import { strapMaterialLabels } from "@/lib/validations/strap"
import { strapDisplayName } from "@/lib/types/strap"
import { WatchViewPhotos } from "./_components/watch-view-photos"
import { WearTodayButton } from "./_components/wear-today-button"
import { CollectionBackLink } from "./_components/collection-back-link"
import { MarketPanel } from "./_components/market-panel"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const watch = await getWatchById(id)
  if (!watch) return { title: "Watch Not Found | TenTenLoupe" }
  return { title: `${watch.brand.name} ${watch.model} | TenTenLoupe` }
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
  valueTone,
  context,
}: {
  href: string
  eyebrow: string
  value: string
  valueSuffix?: React.ReactNode
  /** Brass marks the one value that is an invitation rather than a fact. */
  valueTone?: "default" | "invite"
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
        <span
          className={cn(
            "font-mono text-lg tabular-nums",
            valueTone === "invite" ? "text-brass" : "text-foreground"
          )}
        >
          {value}
        </span>
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
  const [watch, wearInfo, valuations, timegrapherRuns, currentStrap, boxConfig, listing, sale] =
    await Promise.all([
      getWatchById(id),
      getWearCountForWatch(id),
      getValuationsForWatch(id),
      getTimegrapherRuns(id),
      getCurrentStrapForWatch(id),
      getBoxConfig(),
      getActiveListing(id),
      getSaleForWatch(id),
    ])

  if (!watch) notFound()

  const photoUrls: Record<string, string> = {}
  for (const [key, value] of watch.photo_urls) photoUrls[key] = value
  const fullPhotoUrls: Record<string, string> = {}
  for (const [key, value] of watch.full_photo_urls) fullPhotoUrls[key] = value

  // Sale status outranks the ownership states: a sold watch is not "owned",
  // and the banner below carries the detail (§3.6).
  const status = watch.is_wishlist
    ? "WISH LIST"
    : watch.is_coming_soon
      ? "COMING SOON"
      : watch.sale_status === "sold"
        ? "SOLD"
        : watch.sale_status === "listed"
          ? "LISTED"
          : watch.sale_status === "candidate"
            ? "SALE CANDIDATE"
            : "OWNED"

  const realizedGain = sale ? gainVersusBasis(sale.net_proceeds_cents, watch) : null

  // §2.5 — the pill earns its place only when it says something the model
  // does not. Compared loosely: "SN0144" and "SN0144-CG7" are the same fact
  // to a reader, and spacing/case should not decide it.
  const flat = (v: string) => v.toLowerCase().replace(/[^a-z0-9]/g, "")
  const showReference =
    Boolean(watch.reference_number) &&
    flat(watch.reference_number ?? "") !== flat(watch.model)

  const movement = watch.movement
  const movementLine = movement
    ? [
        caliberLabel(movement),
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

  // §2.7 — the number and its unit are separate, so the unit can be muted.
  // A brass or full-strength "mm" puts the accent on the least meaningful
  // token in the row; the measurement is the meaning.
  const measurements: { label: string; value: number; unit: string }[] = (
    [
      { label: "Diameter", value: watch.case_diameter_mm, unit: "mm" },
      { label: "Height", value: watch.case_height_mm, unit: "mm" },
      { label: "Lug-to-lug", value: watch.lug_to_lug_mm, unit: "mm" },
      { label: "Lug width", value: watch.strap_width_mm, unit: "mm" },
      { label: "Weight", value: watch.weight_g, unit: "g" },
      { label: "Water res.", value: watch.water_resistance_m, unit: "m" },
    ] as { label: string; value: number | null; unit: string }[]
  ).filter((m): m is { label: string; value: number; unit: string } => m.value != null)

  const latestRun = timegrapherRuns[0]

  return (
    <div className="mx-auto max-w-[1180px] space-y-5 pb-8">
      {/* Back link — returns to the collection as it was left (filters + search). */}
      <CollectionBackLink />

      {/* Title row */}
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0 space-y-2">
          {/* Weight 400, matching the home stage (Phase 8 §5, Phase 9 §2.5):
              size alone carries the hierarchy. */}
          <h1 className="font-display text-lg font-normal tracking-tight">
            {watch.brand.name}{" "}
            <span className="font-normal text-muted-foreground">
              {watch.model}
              {watch.nickname ? ` “${watch.nickname}”` : ""}
            </span>
          </h1>
          {/* Meta row — status is data, never brass (A1). */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Suppressed when it only repeats the model — plenty of watches
                are named by their reference, and printing it twice in one
                header is noise (§2.5). */}
            {showReference && (
              <>
                <span className="font-mono text-xs text-muted-foreground">
                  {watch.reference_number}
                </span>
                <span className="h-3 w-px bg-border" aria-hidden="true" />
              </>
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
          {/* No count beneath it (§2.3): the WEAR card says how many times,
              once. Three statements of zero on one screen was the defect. */}
          {!watch.is_wishlist && <WearTodayButton watchId={watch.id} />}
          <Button
            render={<Link href={`/watch/${watch.id}/edit?from=watch`} />}
            className="gap-1.5 bg-brass text-brass-foreground hover:bg-brass/90"
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
            Edit
          </Button>
        </div>
      </div>

      {/* Sold banner (§3.6) — brass-free; the only colour is the gain. */}
      {sale && (
        <Link
          href="/market/sold"
          className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-border bg-muted/50 px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:border-muted-foreground/40"
        >
          <span className="font-mono text-2xs uppercase tracking-[0.14em] text-foreground">
            Sold {formatDate(sale.sold_at)}
          </span>
          <span className="font-mono tabular-nums text-foreground">
            {formatCurrency(sale.net_proceeds_cents, sale.currency)} net
          </span>
          <GainValue gain={realizedGain} currency={sale.currency} showPct />
          <span className="ml-auto text-xs">View the sale record →</span>
        </Link>
      )}

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
            {/* One rhythm for the card (§2.7): every row is a single
                label/value pair. The old two-per-row grid for measurements
                made the card change shape halfway down for no reason the
                reader could see. */}
            {measurements.map((m) => (
              <SpecRow key={m.label} label={m.label}>
                <span className="tabular-nums">{m.value}</span>
                <span className="text-muted-foreground"> {m.unit}</span>
              </SpecRow>
            ))}
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

      {/* Market panel (§3.3) — estimate, trend, actions, basis + lifecycle. */}
      <MarketPanel watch={watch} valuations={valuations} listing={listing} sale={sale} />

      {/* Strips — each renders an empty state rather than disappearing (A1). */}
      {/* §2.7 — these span the full measure at 1/2 each rather than sitting in
          a 3-column grid whose third slot is usually empty. The Strap card is
          conditional, so a fixed 3-up left a hole on most watches; `auto-fit`
          fills the row with whatever actually exists. */}
      <div className="grid gap-3.5 sm:grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
        {!watch.is_wishlist && (
          <Strip
            href="/wear-log"
            eyebrow="Wear"
            value={wearInfo.count === 0 ? "never" : String(wearInfo.count)}
            valueTone={wearInfo.count === 0 ? "invite" : "default"}
            valueSuffix={
              wearInfo.count > 0 ? (
                <span className="text-muted-foreground">wears</span>
              ) : undefined
            }
            context={
              wearInfo.lastWorn ? (
                <>
                  Last worn{" "}
                  <span className="text-foreground">{formatDate(wearInfo.lastWorn)}</span> ·{" "}
                  {daysAgo(wearInfo.lastWorn)} days ago
                </>
              ) : (
                // Phase 8's invitation voice, and the ONLY place this screen
                // states the zero (§2.3).
                "give it a day"
              )
            }
          />
        )}
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
              // §2.4 — no empty state names another page in prose. The whole
              // strip is already a link to the edit form, so it says what
              // pressing it does.
              <span className="text-brass">Record a run →</span>
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

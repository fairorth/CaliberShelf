import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ChevronRight,
  Cog,
  FolderOpen,
  Layers,
  Pencil,
  Ruler,
  Settings2,
  Tag,
  Wallet,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { SectionCard, SectionSubHeading, SECTION_LABEL } from "@/components/section-card"
import { getWatchById } from "@/lib/queries/watches"
import { getWearCountForWatch } from "@/lib/queries/wear-logs"
import { getValuationsForWatch } from "@/lib/queries/valuations"
import { getActiveListing, getSaleForWatch, daysBetween, todayDate, LISTING_AGING_DAYS } from "@/lib/queries/sales"
import { getLabelsForWatch } from "@/lib/queries/labels"
import { gainVersusBasis } from "@/lib/queries/portfolio"
import { GainValue } from "@/components/gain-value"
import { getTimegrapherRuns } from "@/lib/queries/timegrapher"
import { getCurrentStrapForWatch } from "@/lib/queries/straps"
import { getBoxConfig } from "@/lib/queries/box-config"
import { getLatestPriceCheckTrace } from "@/lib/queries/agent-trace"
import { boxLabel } from "@/lib/boxes"
import { cn, formatCurrency } from "@/lib/utils"
import {
  caseMaterialLabels,
  crystalLabels,
  caseShapeLabels,
  KNOWN_COMPLICATIONS,
} from "@/lib/validations/watch"
import { caliberTypeLabels } from "@/lib/validations/movement"
import { caliberLabel } from "@/lib/caliber"
import { labelColorMap, type LabelColor } from "@/lib/validations/label"
import { strapMaterialLabels } from "@/lib/validations/strap"
import { strapDisplayName } from "@/lib/types/strap"
import { WatchViewPhotos } from "./_components/watch-view-photos"
import { WearTodayButton } from "./_components/wear-today-button"
import { CollectionBackLink } from "./_components/collection-back-link"
import { MarketPanel } from "./_components/market-panel"
import { attachmentLabels } from "@/lib/validations/watch"
import { LifecycleControls } from "./_components/lifecycle-controls"
import { TimegrapherPanel } from "./_components/timegrapher-panel"

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

/**
 * One read-only field, shaped like the edit form's field: label above value,
 * same size, same grid cell. The edit page's version of this row has an input
 * box around the value and nothing else differs — which is the point.
 *
 * An absent value reads `—`. That is a value marker, not the placeholder text
 * the edit form no longer carries: a labelled blank with nothing under it
 * reads as a rendering fault.
 */
function ViewField({
  label,
  mono,
  className,
  children,
}: {
  label: string
  mono?: boolean
  className?: string
  children?: React.ReactNode
}) {
  const empty = children == null || children === "" || children === false
  return (
    <div className={cn("space-y-1", className)}>
      <p className={SECTION_LABEL}>{label}</p>
      <div
        className={cn(
          "min-h-[1.35rem] text-xs",
          mono && "font-mono tabular-nums",
          empty ? "text-muted-foreground" : "text-foreground"
        )}
      >
        {empty ? "—" : children}
      </div>
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
            "font-mono text-md tabular-nums",
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
  const [
    watch,
    wearInfo,
    valuations,
    timegrapherRuns,
    currentStrap,
    boxConfig,
    listing,
    sale,
    watchLabels,
    priceCheckTrace,
  ] = await Promise.all([
    getWatchById(id),
    getWearCountForWatch(id),
    getValuationsForWatch(id),
    getTimegrapherRuns(id),
    getCurrentStrapForWatch(id),
    getBoxConfig(),
    getActiveListing(id),
    getSaleForWatch(id),
    getLabelsForWatch(id),
    getLatestPriceCheckTrace(id),
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
          ? "FOR SALE"
          : "OWNED"

  // The Ownership section's own value — the same three-way choice the edit
  // form offers, not the sale lifecycle (which the Market section owns).
  const ownership = watch.is_wishlist
    ? "Wish list"
    : watch.is_coming_soon
      ? "Coming soon"
      : "Owned"

  const realizedGain = sale ? gainVersusBasis(sale.net_proceeds_cents, watch) : null

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

  const complications = new Set(
    (watch.complication ?? "")
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean)
  )

  // §2.7 — the number and its unit are separate, so the unit can be muted.
  // A brass or full-strength "mm" puts the accent on the least meaningful
  // token in the row; the measurement is the meaning.
  const measurements: { label: string; value: number | null; unit: string }[] = [
    { label: "Diameter", value: watch.case_diameter_mm, unit: "mm" },
    { label: "Height", value: watch.case_height_mm, unit: "mm" },
    { label: "Lug-to-lug", value: watch.lug_to_lug_mm, unit: "mm" },
    { label: "Lug width", value: watch.strap_width_mm, unit: "mm" },
    { label: "Weight", value: watch.weight_g, unit: "g" },
    { label: "Water res.", value: watch.water_resistance_m, unit: "m" },
  ]

  // The selling controls moved into Ownership, so the figures they quote are
  // computed here. Only agent rows may anchor a price suggestion — manual rows
  // never move a total (see queries/portfolio.ts).
  const latestAgentValuation = valuations.find((v) => v.source === "agent") ?? null
  const daysListed = listing ? daysBetween(listing.listed_at, todayDate()) ?? 0 : null
  // A watch you do not own yet has no sale to plan.
  const showLifecycle = !watch.is_wishlist && !watch.is_coming_soon

  const acquisitionCosts = (
    [
      ["Shipping", watch.acq_shipping_cents],
      ["Tax", watch.acq_tax_cents],
      ["Duty", watch.acq_duty_cents],
    ] as const
  ).filter(([, cents]) => (cents ?? 0) > 0)

  // A measure, not the whole monitor. Without the max-width the 38%/1fr split
  // is computed against the full window — on a wide screen that is a
  // thousand-pixel column holding a four-hundred-pixel photograph, and the two
  // columns stop looking like they belong to the same page.
  return (
    <div className="mx-auto max-w-[1180px] space-y-6 pb-8">
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
          {/* Say each fact ONCE. The reference number, the box and the price-
              tracking flag all have fields of their own below now, so the meta
              row carries only a sale/ownership state worth flagging — and not
              `OWNED`, which is the default and appears in Ownership. */}
          {status !== "OWNED" && (
            <span className="inline-block rounded-full bg-muted px-[9px] py-[3px] font-mono text-2xs uppercase tracking-[0.1em] text-foreground">
              {status}
            </span>
          )}
        </div>

        {/* Actions — Edit is the only primary action; Delete lives on the
            edit page only (A1). */}
        <div className="flex shrink-0 items-center gap-2.5">
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

      {/* Same two columns as the edit page, same widths, same sticky photo
          rail. A watch should not move around the screen because you pressed
          Edit — the only thing that changes is that the fields accept typing. */}
      <div className="grid gap-6 lg:grid-cols-[minmax(420px,38%)_1fr] lg:items-start lg:gap-[26px]">
        {/* The photograph follows you down the page — the right column is
            twice its height, so pinned it is the difference between a short
            column and an empty one.

            The max-height is the guard that made me drop the sticky in the
            first place: with the wear and strap cards below it, this column
            can outgrow a short viewport, and a sticky element taller than the
            screen strands its own bottom edge. Bounded and scrollable, it
            cannot. */}
        <div className="space-y-3.5 lg:sticky lg:top-[calc(3.5rem+1.5rem)] lg:max-h-[calc(100dvh-5.5rem)] lg:self-start lg:overflow-y-auto">
          <WatchViewPhotos
            photos={watch.watch_photos}
            photoUrls={photoUrls}
            fullPhotoUrls={fullPhotoUrls}
            watchId={watch.id}
          />

          {/* Wear and strap — the two facts this page carries that the edit
              form does not, each a link to where they are kept.

              They sit under the photograph rather than across the foot of the
              page. Full width they were two short cards stretched over a
              thousand pixels of nothing, and neither is a fact about the
              watch's record — they are about the object itself, which is what
              this column shows. */}
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

          {/* Timegrapher joins wear and strap rather than sitting under the
              record on the right. All three are the same kind of fact — how
              this object behaves — against a right column that describes what
              it IS. It also costs the right column its worst overhang. */}
          <TimegrapherPanel
            watchId={watch.id}
            runs={timegrapherRuns}
            liftAngle={movement?.lift_angle ?? null}
            caliberName={movement?.caliber_name ?? null}
            readOnly
          />
        </div>

        {/* Identity → Ownership → Specifications → Labels → Market →
            Timegrapher: the edit form's order, field for field.

            min-w-0: this is the `1fr` track, whose automatic minimum is its
            content, so one wide row inside (a long URL in the run trace) would
            otherwise widen the column and scroll the page sideways. */}
        <div className="min-w-0 space-y-6">
          <SectionCard
            id="identity"
            icon={Tag}
            title="Identity"
            contentClassName="grid gap-x-4 gap-y-3 sm:grid-cols-2"
          >
            <ViewField label="Brand">{watch.brand.name}</ViewField>
            <ViewField label="Model">{watch.model}</ViewField>
            <ViewField label="Nickname">{watch.nickname}</ViewField>
            <ViewField label="Category">{watch.category?.name}</ViewField>
            <ViewField label="Reference Number" mono>
              {watch.reference_number}
            </ViewField>
            <ViewField label="Serial Number" mono>
              {watch.serial_number}
            </ViewField>
          </SectionCard>

          <SectionCard
            id="ownership"
            icon={Wallet}
            title="Ownership"
            contentClassName="grid gap-x-4 gap-y-3 sm:grid-cols-2"
          >
            <ViewField label="Purchase Date" mono>
              {watch.purchase_date ? formatDate(watch.purchase_date) : null}
            </ViewField>
            <ViewField label="Purchase Price" mono>
              {watch.purchase_price_cents != null
                ? formatCurrency(watch.purchase_price_cents, watch.purchase_currency)
                : null}
            </ViewField>
            {/* Shown only when there are any — three rows of $0.00 is the
                sparseness the edit form's collapsed control exists to avoid. */}
            {acquisitionCosts.length > 0 && (
              <div className="grid gap-x-4 gap-y-3 sm:col-span-2 sm:grid-cols-4">
                {acquisitionCosts.map(([label, cents]) => (
                  <ViewField key={label} label={label} mono>
                    {formatCurrency(cents ?? 0, watch.purchase_currency)}
                  </ViewField>
                ))}
                {/* The generated total, shown only when there is something to
                    total. With no acquisition costs it IS the purchase price
                    two fields up, and printing it twice is how the two come to
                    disagree later. */}
                <ViewField label="Cost basis" mono>
                  {formatCurrency(watch.cost_basis_cents, watch.purchase_currency)}
                </ViewField>
              </div>
            )}
            <ViewField label="Box">
              {watch.box ? boxLabel(watch.box, boxConfig.descriptions) : null}
            </ViewField>
            {/* Whether you own it. The sale controls that used to sit under
                this label now live in Market, where the rest of the sale
                record is — one home per fact. */}
            <div className="space-y-1">
              <p className={SECTION_LABEL}>Ownership</p>
              <div className="min-h-[1.35rem] text-xs text-foreground">{ownership}</div>
            </div>
            {/* Attachment (00051) — how much you love it. It belongs with
                ownership, not with Market: it is the reason a watch survives
                a bad valuation, and putting it beside the money would read as
                a rating OF the money. */}
            <ViewField label="Attachment">
              {watch.attachment ? attachmentLabels[watch.attachment] : null}
            </ViewField>
            <ViewField label="Notes" className="sm:col-span-2">
              {watch.notes ? (
                <span className="whitespace-pre-wrap">{watch.notes}</span>
              ) : null}
            </ViewField>
          </SectionCard>

          <SectionCard
            id="specifications"
            icon={Settings2}
            title="Specifications"
            contentClassName="space-y-5"
          >
            <SectionSubHeading icon={Cog}>Movement</SectionSubHeading>
            <ViewField label="Movement / Caliber">{movementLine}</ViewField>

            <SectionSubHeading icon={Ruler}>Case</SectionSubHeading>
            <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
              <ViewField label="Case Material">
                {watch.case_material
                  ? caseMaterialLabels[watch.case_material] ?? watch.case_material
                  : null}
              </ViewField>
              <ViewField label="Crystal">
                {watch.crystal ? crystalLabels[watch.crystal] ?? watch.crystal : null}
              </ViewField>
              <ViewField label="Case Shape">
                {watch.case_shape
                  ? caseShapeLabels[watch.case_shape] ?? watch.case_shape
                  : null}
              </ViewField>
              <ViewField label="Dial Color">{watch.dial_color}</ViewField>
              <ViewField label="Bezel">
                {watch.rotating_bezel ? "Rotating bezel" : null}
              </ViewField>
            </div>

            <div className="rounded-lg border border-border p-4">
              <h5 className="mb-3 font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground">
                Measurements
              </h5>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {measurements.map((m) => (
                  <ViewField key={m.label} label={m.label} mono>
                    {m.value != null ? (
                      <>
                        {m.value}
                        <span className="text-muted-foreground"> {m.unit}</span>
                      </>
                    ) : null}
                  </ViewField>
                ))}
              </div>
            </div>

            <SectionSubHeading icon={Layers}>Complications</SectionSubHeading>
            {/* The same list the edit form checkboxes, with the checked ones
                marked — so the two pages agree on what the watch does NOT
                have, not only on what it does. */}
            <div className="flex flex-wrap gap-1.5">
              {KNOWN_COMPLICATIONS.map((name) => (
                <span
                  key={name}
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs",
                    complications.has(name)
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground/50"
                  )}
                >
                  {name}
                </span>
              ))}
            </div>
          </SectionCard>

          {watchLabels.length > 0 && (
            <SectionCard id="labels" icon={FolderOpen} title="Labels">
              <div className="flex flex-wrap gap-2">
                {watchLabels.map((label) => {
                  const colors =
                    labelColorMap[label.color as LabelColor] ?? labelColorMap.blue
                  return (
                    <span
                      key={label.id}
                      className={cn(
                        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
                        colors.bg,
                        colors.text
                      )}
                    >
                      {label.name}
                    </span>
                  )
                })}
              </div>
            </SectionCard>
          )}

          {/* Valuation panel (§3.3) — value, actions, and the sale record.
              The sale controls are passed in rather than imported there so
              the panel stays a Server Component. */}
          <MarketPanel
            watch={watch}
            valuations={valuations}
            listing={listing}
            sale={sale}
            trace={priceCheckTrace}
            saleControls={
              showLifecycle ? (
                <LifecycleControls
                  watchId={watch.id}
                  watchName={`${watch.brand.name} ${watch.model}`.trim()}
                  referenceNumber={watch.reference_number}
                  saleStatus={watch.sale_status}
                  costBasisCents={watch.cost_basis_cents}
                  purchasePriceKnown={watch.purchase_price_cents != null}
                  purchaseDate={watch.purchase_date}
                  latestMidCents={latestAgentValuation?.value_mid_cents ?? null}
                  latestLowCents={latestAgentValuation?.value_low_cents ?? null}
                  latestHighCents={latestAgentValuation?.value_high_cents ?? null}
                  listing={listing}
                  daysListed={daysListed}
                  listingAging={daysListed != null && daysListed > LISTING_AGING_DAYS}
                  sale={sale}
                />
              ) : null
            }
          />

        </div>
      </div>

    </div>
  )
}

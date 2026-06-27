import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { MovementPreview } from "@/components/movement-preview"
import {
  caseMaterialLabels,
  crystalLabels,
} from "@/lib/validations/watch"
import { labelColorMap } from "@/lib/validations/label"
import type { Watch, Brand, Movement, Category, Label } from "@/lib/types/watch"
import type { LabelColor } from "@/lib/validations/label"

interface WatchSpecsProps {
  watch: Watch & { brand: Brand; movement: Movement | null }
  category?: Category | null
  labels?: Label[]
}

function SpecRow({
  label,
  value,
  accent,
  mono,
}: {
  label: string
  value: string | null | undefined
  accent?: string
  mono?: boolean
}) {
  const hasValue = value && value !== "—"
  return (
    <div className="flex justify-between gap-4 py-2.5 group">
      <span className="text-sm text-muted-foreground">{label}</span>
      {hasValue ? (
        <span
          className={[
            "text-sm",
            mono ? "font-mono text-[13px] tracking-tight" : "font-medium",
            accent ?? "",
          ].join(" ")}
        >
          {value}
        </span>
      ) : (
        <span className="text-sm text-muted-foreground/45">Not set</span>
      )}
    </div>
  )
}

/** Dial color row with a small swatch dot. The swatch uses the last word of the
 * color name (e.g. "Sunburst Blue" → "blue"), which is a valid CSS color for the
 * common cases; a hairline border keeps an unrecognized color visible. */
function DialColorRow({ value }: { value: string | null | undefined }) {
  const hasValue = !!value && value !== "—"
  const swatch = hasValue ? value!.trim().split(/\s+/).pop()!.toLowerCase() : null
  return (
    <div className="flex justify-between gap-4 py-2.5">
      <span className="text-sm text-muted-foreground">Dial Color</span>
      {hasValue ? (
        <span className="flex items-center gap-2 text-sm font-medium">
          <span
            className="h-3 w-3 rounded-full border border-white/20"
            style={{ background: swatch ?? "transparent" }}
          />
          {value}
        </span>
      ) : (
        <span className="text-sm text-muted-foreground/45">Not set</span>
      )}
    </div>
  )
}

/** Unified spec card — brass spine, serif title, brass-tinted icon chip. */
function SpecCard({
  icon,
  title,
  contentClassName,
  children,
}: {
  icon: string
  title: string
  contentClassName?: string
  children: React.ReactNode
}) {
  return (
    <Card className="overflow-hidden rounded-2xl border-l-2 border-l-brass/40">
      <CardHeader className="bg-brass/5 pb-3">
        <CardTitle className="flex items-center gap-2.5 font-display text-[19px] font-semibold">
          <span className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-brass/15 text-sm text-brass">
            {icon}
          </span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className={contentClassName}>{children}</CardContent>
    </Card>
  )
}

function SectionLabel({ children, icon }: { children: React.ReactNode; icon?: string }) {
  return (
    <div className="flex items-center gap-2 pb-1 pt-4 first:pt-1">
      {icon && <span className="text-xs opacity-60">{icon}</span>}
      <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">
        {children}
      </h4>
      <div className="h-px flex-1 bg-gradient-to-r from-border/60 to-transparent" />
    </div>
  )
}

export function WatchSpecs({ watch, category, labels = [] }: WatchSpecsProps) {
  const movement = watch.movement

  const complicationParts = (watch.complication ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)

  return (
    <div className="space-y-4">
      {/* ── Card 1: Identity & Ownership ──────────────────────── */}
      <SpecCard icon="🏷️" title="Identity & Ownership" contentClassName="divide-y divide-border/40">
        <SpecRow label="Brand" value={watch.brand.name} />
        <SpecRow label="Model" value={watch.model} />
        <SpecRow label="Nickname" value={watch.nickname} accent="italic" />
        <SpecRow label="Reference Number" value={watch.reference_number} mono />
        <SpecRow label="Serial Number" value={watch.serial_number} mono />
        <SpecRow
          label="Purchase Date"
          value={
            watch.purchase_date
              ? new Date(watch.purchase_date + "T00:00:00").toLocaleDateString(
                  "en-US",
                  { year: "numeric", month: "long", day: "numeric" }
                )
              : null
          }
        />
        <SpecRow
          label="Purchase Price"
          value={
            watch.purchase_price_cents !== null
              ? formatCurrency(watch.purchase_price_cents, watch.purchase_currency)
              : null
          }
          mono
          accent="text-brass"
        />

        {/* Notes */}
        <div className="py-3">
          <span className="text-sm text-muted-foreground">Notes</span>
          {watch.notes ? (
            <div className="mt-2 rounded-md bg-muted/40 px-3 py-2">
              <p className="text-sm italic leading-relaxed whitespace-pre-wrap text-foreground/80">{watch.notes}</p>
            </div>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground/45">Not set</p>
          )}
        </div>
      </SpecCard>

      {/* ── Card 2: Specifications ────────────────────────────── */}
      <SpecCard icon="⚙️" title="Specifications" contentClassName="space-y-1">
        {/* Movement subsection */}
        <SectionLabel icon="⏱️">Movement</SectionLabel>
        {movement ? (
          <MovementPreview movement={movement} />
        ) : (
          <p className="py-2 text-sm text-muted-foreground italic">No movement selected</p>
        )}

        {/* Case subsection */}
        <SectionLabel icon="🔩">Case</SectionLabel>
        <div className="divide-y divide-border/40">
          <SpecRow
            label="Case Material"
            value={watch.case_material ? caseMaterialLabels[watch.case_material] : null}
          />
          <SpecRow
            label="Crystal"
            value={watch.crystal ? crystalLabels[watch.crystal] : null}
          />
          <SpecRow label="Case Diameter" value={watch.case_diameter_mm ? `${watch.case_diameter_mm} mm` : null} mono />
          <SpecRow label="Strap Width" value={watch.strap_width_mm ? `${watch.strap_width_mm} mm` : null} mono />
          <SpecRow label="Lug-to-Lug" value={watch.lug_to_lug_mm ? `${watch.lug_to_lug_mm} mm` : null} mono />
          <SpecRow label="Case Height" value={watch.case_height_mm ? `${watch.case_height_mm} mm` : null} mono />
          <SpecRow label="Water Resistance" value={watch.water_resistance_m ? `${watch.water_resistance_m} m` : null} mono />
          <DialColorRow value={watch.dial_color} />
        </div>

        {/* Complications subsection */}
        <SectionLabel icon="✨">Complications</SectionLabel>
        {complicationParts.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 py-2">
            {complicationParts.map((c) => (
              <Badge
                key={c}
                variant="outline"
                className="border-primary/30 bg-primary/10 text-primary text-xs font-medium"
              >
                {c}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="py-2 text-sm text-muted-foreground/45">Not set</p>
        )}
      </SpecCard>

      {/* ── Card 3: Category & Labels ─────────────────────────── */}
      <SpecCard icon="📂" title="Category & Labels" contentClassName="space-y-4">
        <div className="flex justify-between py-2.5">
          <span className="text-sm text-muted-foreground">Category</span>
          {category ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs font-medium">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: category.color ?? "var(--muted-foreground)" }}
              />
              {category.name}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground/45">Not set</span>
          )}
        </div>

        <div>
          <span className="text-sm text-muted-foreground">Labels</span>
          {labels.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {labels.map((label) => {
                const colors = labelColorMap[label.color as LabelColor] ?? labelColorMap.blue
                return (
                  <span
                    key={label.id}
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium shadow-sm ${colors.bg} ${colors.text}`}
                  >
                    {label.name}
                  </span>
                )
              })}
            </div>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground/45">Not set</p>
          )}
        </div>
      </SpecCard>
    </div>
  )
}

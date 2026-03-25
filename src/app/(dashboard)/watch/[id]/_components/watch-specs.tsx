import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { MovementPreview } from "@/components/movement-preview"
import {
  caseMaterialLabels,
  crystalLabels,
  conditionLabels,
} from "@/lib/validations/watch"
import { labelColorMap } from "@/lib/validations/label"
import type { Watch, Brand, Movement, Category, Label } from "@/lib/types/watch"
import type { LabelColor } from "@/lib/validations/label"

interface WatchSpecsProps {
  watch: Watch & { brand: Brand; movement: Movement | null }
  category?: Category | null
  labels?: Label[]
}

function SpecRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between py-2.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value || "—"}</span>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 pb-1 pt-3 first:pt-0">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
        {children}
      </h4>
      <div className="h-px flex-1 bg-border/50" />
    </div>
  )
}

export function WatchSpecs({ watch, category, labels = [] }: WatchSpecsProps) {
  const movement = watch.movement

  // Parse complications into known + other for display
  const complicationParts = (watch.complication ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)

  return (
    <div className="space-y-4">
      {/* ── Card 1: Identity & Ownership ──────────────────────── */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-xs">
              🏷️
            </span>
            Identity & Ownership
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border/50">
          <SpecRow label="Brand" value={watch.brand.name} />
          <SpecRow label="Model" value={watch.model} />
          <SpecRow label="Nickname" value={watch.nickname} />
          <SpecRow label="Reference Number" value={watch.reference_number} />
          <SpecRow label="Serial Number" value={watch.serial_number} />
          <SpecRow
            label="Condition"
            value={watch.condition ? conditionLabels[watch.condition] : null}
          />
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
          />

          {/* Notes */}
          <div className="py-2.5">
            <span className="text-sm text-muted-foreground">Notes</span>
            {watch.notes ? (
              <p className="mt-1 text-sm italic whitespace-pre-wrap">{watch.notes}</p>
            ) : (
              <p className="mt-1 text-sm font-medium">—</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Card 2: Specifications (Movement + Case + Complications) ── */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-500/5 to-transparent pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-500/10 text-xs">
              ⚙️
            </span>
            Specifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {/* Movement subsection */}
          <SectionLabel>Movement</SectionLabel>
          {movement ? (
            <MovementPreview movement={movement} />
          ) : (
            <p className="py-2 text-sm text-muted-foreground">No movement selected</p>
          )}

          {/* Case subsection */}
          <SectionLabel>Case</SectionLabel>
          <div className="divide-y divide-border/50">
            <SpecRow
              label="Case Material"
              value={watch.case_material ? caseMaterialLabels[watch.case_material] : null}
            />
            <SpecRow
              label="Crystal"
              value={watch.crystal ? crystalLabels[watch.crystal] : null}
            />
            <SpecRow
              label="Case Diameter"
              value={watch.case_diameter_mm ? `${watch.case_diameter_mm}mm` : null}
            />
            <SpecRow
              label="Lug Width"
              value={watch.lug_width_mm ? `${watch.lug_width_mm}mm` : null}
            />
            <SpecRow
              label="Case Height"
              value={watch.case_height_mm ? `${watch.case_height_mm}mm` : null}
            />
            <SpecRow
              label="Water Resistance"
              value={watch.water_resistance_m ? `${watch.water_resistance_m}m` : null}
            />
            <SpecRow label="Dial Color" value={watch.dial_color} />
          </div>

          {/* Complications subsection */}
          <SectionLabel>Complications</SectionLabel>
          {complicationParts.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 py-2">
              {complicationParts.map((c) => (
                <Badge
                  key={c}
                  variant="outline"
                  className="border-purple-500/30 bg-purple-500/5 text-purple-700 dark:text-purple-400 text-xs"
                >
                  {c}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="py-2 text-sm font-medium">—</p>
          )}
        </CardContent>
      </Card>

      {/* ── Card 3: Category & Labels ─────────────────────────── */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-amber-500/5 to-transparent pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-500/10 text-xs">
              📂
            </span>
            Category & Labels
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between py-2.5">
            <span className="text-sm text-muted-foreground">Category</span>
            <span className="text-sm font-medium">
              {category?.name ?? "—"}
            </span>
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
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors.bg} ${colors.text}`}
                    >
                      {label.name}
                    </span>
                  )
                })}
              </div>
            ) : (
              <p className="mt-1 text-sm font-medium">—</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

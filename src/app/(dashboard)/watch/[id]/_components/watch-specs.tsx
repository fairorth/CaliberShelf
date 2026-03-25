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

function SpecRow({ label, value, accent }: { label: string; value: string | null | undefined; accent?: string }) {
  return (
    <div className="flex justify-between py-2.5 group">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm font-medium ${accent && value && value !== "—" ? accent : ""}`}>
        {value || "—"}
      </span>
    </div>
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
      <Card className="overflow-hidden border-l-4 border-l-slate-400/40 dark:border-l-slate-500/30">
        <CardHeader className="bg-gradient-to-br from-slate-100/80 via-slate-50/40 to-transparent dark:from-slate-800/30 dark:via-slate-900/10 dark:to-transparent pb-3">
          <CardTitle className="flex items-center gap-2.5 text-base">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-200/80 dark:bg-slate-700/50 text-sm shadow-sm">
              🏷️
            </span>
            Identity & Ownership
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border/40">
          <SpecRow label="Brand" value={watch.brand.name} />
          <SpecRow label="Model" value={watch.model} />
          <SpecRow label="Nickname" value={watch.nickname} accent="italic" />
          <SpecRow label="Reference Number" value={watch.reference_number} accent="font-mono text-xs tracking-wide" />
          <SpecRow label="Serial Number" value={watch.serial_number} accent="font-mono text-xs tracking-wide" />
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
            accent="text-emerald-700 dark:text-emerald-400"
          />

          {/* Notes */}
          <div className="py-3">
            <span className="text-sm text-muted-foreground">Notes</span>
            {watch.notes ? (
              <div className="mt-2 rounded-md bg-muted/40 px-3 py-2">
                <p className="text-sm italic leading-relaxed whitespace-pre-wrap text-foreground/80">{watch.notes}</p>
              </div>
            ) : (
              <p className="mt-1 text-sm font-medium">—</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Card 2: Specifications ────────────────────────────── */}
      <Card className="overflow-hidden border-l-4 border-l-blue-400/40 dark:border-l-blue-500/30">
        <CardHeader className="bg-gradient-to-br from-blue-50/80 via-sky-50/30 to-transparent dark:from-blue-950/30 dark:via-blue-900/10 dark:to-transparent pb-3">
          <CardTitle className="flex items-center gap-2.5 text-base">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100/80 dark:bg-blue-900/40 text-sm shadow-sm">
              ⚙️
            </span>
            Specifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
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
              accent="text-sky-700 dark:text-sky-400"
            />
            <SpecRow label="Dial Color" value={watch.dial_color} />
          </div>

          {/* Complications subsection */}
          <SectionLabel icon="✨">Complications</SectionLabel>
          {complicationParts.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 py-2">
              {complicationParts.map((c) => (
                <Badge
                  key={c}
                  variant="outline"
                  className="border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300 text-xs font-medium"
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
      <Card className="overflow-hidden border-l-4 border-l-amber-400/40 dark:border-l-amber-500/30">
        <CardHeader className="bg-gradient-to-br from-amber-50/80 via-orange-50/30 to-transparent dark:from-amber-950/20 dark:via-amber-900/10 dark:to-transparent pb-3">
          <CardTitle className="flex items-center gap-2.5 text-base">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100/80 dark:bg-amber-900/40 text-sm shadow-sm">
              📂
            </span>
            Category & Labels
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between py-2.5">
            <span className="text-sm text-muted-foreground">Category</span>
            {category ? (
              <Badge className="bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/25 text-xs font-medium">
                {category.name}
              </Badge>
            ) : (
              <span className="text-sm font-medium">—</span>
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
              <p className="mt-1 text-sm font-medium">—</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

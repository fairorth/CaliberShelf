import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { formatCurrency } from "@/lib/utils"
import {
  caseMaterialLabels,
  crystalLabels,
  conditionLabels,
  movementLabels,
} from "@/lib/validations/watch"
import type { Watch, Brand, Movement } from "@/lib/types/watch"

interface WatchSpecsProps {
  watch: Watch & { brand: Brand; movement: Movement | null }
}

function SpecRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className="flex justify-between py-2.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
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

export function WatchSpecs({ watch }: WatchSpecsProps) {
  const movement = watch.movement

  const hasOwnership = watch.condition || watch.purchase_date || watch.purchase_price_cents !== null
  const hasCase = watch.case_material || watch.crystal ||
    watch.case_diameter_mm || watch.lug_width_mm || watch.case_height_mm ||
    watch.water_resistance_m || watch.dial_color
  const hasComplications = !!watch.complication

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
          {watch.nickname && <SpecRow label="Nickname" value={watch.nickname} />}
          <SpecRow label="Reference" value={watch.reference_number} />
          <SpecRow label="Serial" value={watch.serial_number} />

          {hasOwnership && (
            <>
              <Separator className="my-1 opacity-50" />
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
            </>
          )}

          {watch.notes && (
            <>
              <Separator className="my-1 opacity-50" />
              <div className="py-2.5">
                <p className="text-sm italic text-muted-foreground whitespace-pre-wrap">
                  {watch.notes}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Card 2: Specifications (Movement + Case + Complications) ── */}
      {(movement || hasCase || hasComplications) && (
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-500/5 to-transparent pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-500/10 text-xs">
                ⚙️
              </span>
              Specifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Movement subsection */}
            {movement && (
              <div>
                <SectionLabel>Movement</SectionLabel>
                <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
                  <div className="flex items-center gap-2 pb-2">
                    <span className="text-sm font-semibold">{movement.caliber_name}</span>
                    <Badge variant="secondary" className="text-[10px]">
                      {movementLabels[movement.movement_type] ?? movement.movement_type}
                    </Badge>
                    {movement.user_id === null && (
                      <span className="text-xs text-muted-foreground" title="System caliber">🌐</span>
                    )}
                  </div>
                  <div className="divide-y divide-border/30">
                    <SpecRow label="Manufacturer" value={movement.manufacturer} />
                    {movement.base_caliber && (
                      <SpecRow label="Base Caliber" value={movement.base_caliber} />
                    )}
                    <SpecRow
                      label="Jewels"
                      value={movement.jewel_count !== null ? `${movement.jewel_count}` : null}
                    />
                    <SpecRow
                      label="Beat Rate"
                      value={movement.beat_rate_vph !== null ? `${movement.beat_rate_vph.toLocaleString()} vph` : null}
                    />
                    <SpecRow
                      label="Power Reserve"
                      value={movement.power_reserve_hours !== null ? `${movement.power_reserve_hours}h` : null}
                    />
                    <SpecRow
                      label="Dimensions"
                      value={
                        movement.diameter_mm !== null
                          ? `${movement.diameter_mm}mm × ${movement.height_mm ?? "?"}mm`
                          : null
                      }
                    />
                    <SpecRow label="Country" value={movement.country_of_origin} />
                  </div>
                  {(movement.hacking || movement.hand_windable || movement.quickset_date) && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {movement.hacking && (
                        <Badge variant="outline" className="border-green-500/30 bg-green-500/5 text-green-700 dark:text-green-400 text-[10px]">
                          Hacking
                        </Badge>
                      )}
                      {movement.hand_windable && (
                        <Badge variant="outline" className="border-blue-500/30 bg-blue-500/5 text-blue-700 dark:text-blue-400 text-[10px]">
                          Hand Wind
                        </Badge>
                      )}
                      {movement.quickset_date && (
                        <Badge variant="outline" className="border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-400 text-[10px]">
                          Quickset Date
                        </Badge>
                      )}
                    </div>
                  )}
                  {movement.complications && (
                    <div className="flex items-start justify-between pt-2">
                      <span className="text-xs text-muted-foreground">Complications</span>
                      <span className="text-xs font-medium">{movement.complications}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Case subsection */}
            {hasCase && (
              <div>
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
              </div>
            )}

            {/* Complications subsection */}
            {hasComplications && (
              <div>
                <SectionLabel>Complications</SectionLabel>
                <div className="flex flex-wrap gap-1.5 py-2">
                  {watch.complication!.split(",").map((c) => c.trim()).filter(Boolean).map((c) => (
                    <Badge
                      key={c}
                      variant="outline"
                      className="border-purple-500/30 bg-purple-500/5 text-purple-700 dark:text-purple-400 text-xs"
                    >
                      {c}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

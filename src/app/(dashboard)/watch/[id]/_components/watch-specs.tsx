import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
    <div className="flex justify-between py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  )
}

export function WatchSpecs({ watch }: WatchSpecsProps) {
  const movement = watch.movement

  return (
    <div className="space-y-4">
      {/* ── Identity & Ownership ──────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Identity & Ownership</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          <SpecRow label="Brand" value={watch.brand.name} />
          <SpecRow label="Model" value={watch.model} />
          {watch.nickname && <SpecRow label="Nickname" value={watch.nickname} />}
          <SpecRow label="Reference" value={watch.reference_number} />
          <SpecRow label="Serial" value={watch.serial_number} />

          {/* Ownership rows */}
          {(watch.condition || watch.purchase_date || watch.purchase_price_cents !== null) && (
            <>
              <div className="pt-1" />
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

          {/* Notes */}
          {watch.notes && (
            <div className="pt-2">
              <p className="text-sm whitespace-pre-wrap">{watch.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Movement / Caliber ────────────────────────────────── */}
      {movement && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Movement</CardTitle>
              <Badge variant="secondary" className="text-xs">
                {movementLabels[movement.movement_type] ?? movement.movement_type}
              </Badge>
              {movement.user_id === null && (
                <span className="text-xs text-muted-foreground" title="System caliber">🌐</span>
              )}
            </div>
          </CardHeader>
          <CardContent className="divide-y">
            <SpecRow label="Caliber" value={movement.caliber_name} />
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
            {/* Feature badges */}
            {(movement.hacking || movement.hand_windable || movement.quickset_date) && (
              <div className="flex flex-wrap gap-1 pt-2">
                {movement.hacking && <Badge variant="outline" className="text-xs">Hacking</Badge>}
                {movement.hand_windable && <Badge variant="outline" className="text-xs">Hand Wind</Badge>}
                {movement.quickset_date && <Badge variant="outline" className="text-xs">Quickset Date</Badge>}
              </div>
            )}
            <SpecRow label="Complications" value={movement.complications} />
            <SpecRow label="Country" value={movement.country_of_origin} />
          </CardContent>
        </Card>
      )}

      {/* ── Specifications ────────────────────────────────────── */}
      {(watch.case_material || watch.crystal ||
        watch.case_diameter_mm || watch.lug_width_mm || watch.case_height_mm ||
        watch.water_resistance_m || watch.dial_color || watch.complication) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Specifications</CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
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
            {/* Complications as badges */}
            {watch.complication && (
              <div className="flex items-start justify-between py-2">
                <span className="text-sm text-muted-foreground">Complications</span>
                <div className="flex flex-wrap gap-1 justify-end">
                  {watch.complication.split(",").map((c) => c.trim()).filter(Boolean).map((c) => (
                    <Badge key={c} variant="outline" className="text-xs">{c}</Badge>
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

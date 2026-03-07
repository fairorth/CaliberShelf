import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import {
  movementLabels,
  caseMaterialLabels,
  crystalLabels,
  conditionLabels,
} from "@/lib/validations/watch"
import type { Watch } from "@/lib/types/watch"

interface WatchSpecsProps {
  watch: Watch
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
  return (
    <div className="space-y-4">
      {/* Identity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          <SpecRow label="Brand" value={watch.brand} />
          <SpecRow label="Model" value={watch.model} />
          {watch.nickname && <SpecRow label="Nickname" value={watch.nickname} />}
          <SpecRow label="Reference" value={watch.reference_number} />
          <SpecRow label="Serial" value={watch.serial_number} />
        </CardContent>
      </Card>

      {/* Specs */}
      {(watch.movement || watch.case_material || watch.crystal ||
        watch.case_diameter_mm || watch.water_resistance_m ||
        watch.dial_color || watch.complication) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Specifications</CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            <SpecRow
              label="Movement"
              value={watch.movement ? movementLabels[watch.movement] : null}
            />
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
              label="Water Resistance"
              value={watch.water_resistance_m ? `${watch.water_resistance_m}m` : null}
            />
            <SpecRow label="Dial Color" value={watch.dial_color} />
            <SpecRow label="Complications" value={watch.complication} />
          </CardContent>
        </Card>
      )}

      {/* Ownership */}
      {(watch.condition || watch.purchase_date || watch.purchase_price_cents !== null) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Ownership</CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
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
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {watch.notes && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{watch.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

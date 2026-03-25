import { Badge } from "@/components/ui/badge"
import { movementLabels } from "@/lib/validations/watch"
import type { Movement } from "@/lib/types/watch"

interface MovementPreviewProps {
  movement: Movement
}

/**
 * Shared read-only movement preview box.
 * Used identically on both the watch edit form and watch detail page.
 */
export function MovementPreview({ movement }: MovementPreviewProps) {
  return (
    <div className="rounded-lg border border-indigo-500/20 bg-gradient-to-br from-indigo-500/[0.04] to-violet-500/[0.04] p-4 space-y-3">
      {/* Header: caliber name + type badge */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-semibold tracking-tight">{movement.caliber_name}</span>
        <Badge className="bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/25 text-[10px]">
          {movementLabels[movement.movement_type] ?? movement.movement_type}
        </Badge>
        {movement.user_id === null && (
          <span className="text-[10px] text-muted-foreground/60" title="System caliber">🌐 System</span>
        )}
      </div>

      {/* Compact stats in a flowing layout */}
      <div className="flex flex-wrap gap-x-3 gap-y-1.5">
        {movement.manufacturer && (
          <Stat label="Manufacturer" value={movement.manufacturer} />
        )}
        {movement.base_caliber && (
          <Stat label="Base" value={movement.base_caliber} />
        )}
        {movement.jewel_count !== null && (
          <Stat label="Jewels" value={`${movement.jewel_count}`} />
        )}
        {movement.beat_rate_vph !== null && (
          <Stat label="Beat Rate" value={`${movement.beat_rate_vph.toLocaleString()} vph`} />
        )}
        {movement.power_reserve_hours !== null && (
          <Stat label="Reserve" value={`${movement.power_reserve_hours}h`} />
        )}
        {movement.diameter_mm !== null && (
          <Stat label="Size" value={`${movement.diameter_mm} × ${movement.height_mm ?? "?"}mm`} />
        )}
        {movement.accuracy_range && (
          <Stat label="Accuracy" value={movement.accuracy_range} />
        )}
        {movement.country_of_origin && (
          <Stat label="Origin" value={movement.country_of_origin} />
        )}
      </div>

      {/* Feature badges */}
      {(movement.hacking || movement.hand_windable || movement.quickset_date) && (
        <div className="flex flex-wrap gap-1.5">
          {movement.hacking && (
            <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px]">
              ✓ Hacking
            </Badge>
          )}
          {movement.hand_windable && (
            <Badge variant="outline" className="border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400 text-[10px]">
              ✓ Hand Wind
            </Badge>
          )}
          {movement.quickset_date && (
            <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px]">
              ✓ Quickset Date
            </Badge>
          )}
        </div>
      )}

      {/* Movement complications */}
      {movement.complications && (
        <div className="flex items-start gap-2 text-xs border-t border-indigo-500/10 pt-2">
          <span className="text-muted-foreground">Complications:</span>
          <span className="font-medium">{movement.complications}</span>
        </div>
      )}
    </div>
  )
}

/** Tiny label/value pair for the compact stats grid */
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-baseline gap-1 text-xs">
      <span className="text-muted-foreground/70">{label}</span>
      <span className="font-semibold text-foreground/90">{value}</span>
    </span>
  )
}

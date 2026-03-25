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
    <div className="rounded-md border bg-muted/30 p-3 space-y-2">
      {/* Header: caliber name + type badge */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{movement.caliber_name}</span>
        <Badge variant="secondary" className="text-xs">
          {movementLabels[movement.movement_type] ?? movement.movement_type}
        </Badge>
        {movement.user_id === null && (
          <span className="text-xs text-muted-foreground" title="System caliber">🌐</span>
        )}
      </div>

      {/* Compact stats row */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {movement.manufacturer && (
          <span>Mfr: {movement.manufacturer}</span>
        )}
        {movement.base_caliber && (
          <span>Base: {movement.base_caliber}</span>
        )}
        {movement.jewel_count !== null && (
          <span>{movement.jewel_count} jewels</span>
        )}
        {movement.beat_rate_vph !== null && (
          <span>{movement.beat_rate_vph.toLocaleString()} vph</span>
        )}
        {movement.power_reserve_hours !== null && (
          <span>{movement.power_reserve_hours}h reserve</span>
        )}
        {movement.diameter_mm !== null && (
          <span>
            {movement.diameter_mm}mm × {movement.height_mm ?? "?"}mm
          </span>
        )}
        {movement.accuracy_range && (
          <span>{movement.accuracy_range}</span>
        )}
        {movement.country_of_origin && (
          <span>{movement.country_of_origin}</span>
        )}
      </div>

      {/* Feature badges */}
      {(movement.hacking || movement.hand_windable || movement.quickset_date) && (
        <div className="flex flex-wrap gap-1">
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

      {/* Movement complications (from the movement table, not the watch) */}
      {movement.complications && (
        <div className="flex items-start gap-2 pt-1 text-xs">
          <span className="text-muted-foreground">Complications:</span>
          <span className="font-medium">{movement.complications}</span>
        </div>
      )}
    </div>
  )
}

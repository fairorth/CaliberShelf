import { Badge } from "@/components/ui/badge"
import { caliberTypeLabels } from "@/lib/validations/movement"
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
        {movement.caliber_type && (
          <Badge className="bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/25 text-[10px]">
            {caliberTypeLabels[movement.caliber_type] ?? movement.caliber_type}
          </Badge>
        )}
      </div>

      {/* Compact stats in a flowing layout */}
      <div className="flex flex-wrap gap-x-3 gap-y-1.5">
        {movement.manufacturer && (
          <Stat label="Manufacturer" value={movement.manufacturer} />
        )}
        {movement.beat_rate && (
          <Stat label="Beat Rate" value={movement.beat_rate} />
        )}
        {movement.power_reserve && (
          <Stat label="Reserve" value={movement.power_reserve} />
        )}
      </div>
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

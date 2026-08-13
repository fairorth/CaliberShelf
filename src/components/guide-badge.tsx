import { StatusPill } from "@/components/ui/status-pill"

/** Pill marking a watch that belongs to a Master Collection Guide — shows the
 *  guide's name so the strategic tier is visible at a glance.
 *
 *  Neutral, not brass: guide membership is a classification, not a status, and
 *  it sits directly beside the two status pills in the Model cell. Was
 *  violet-500. */
export function GuideBadge({ name, className }: { name: string; className?: string }) {
  return (
    <StatusPill tone="neutral" title={`In the ${name} collection guide`} className={className}>
      {name}
    </StatusPill>
  )
}

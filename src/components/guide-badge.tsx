import { StatusPill } from "@/components/ui/status-pill"

/** Pill marking a guide watch (`watches.is_guide_watch`, 00055) — shows the
 *  guide's name so the strategic tier is visible at a glance. A flagged watch
 *  with no guide link (rare: flagged by hand) reads plain "Guide".
 *
 *  Neutral, not brass: guide membership is a classification, not a status, and
 *  it sits directly beside the two status pills in the Model cell. Was
 *  violet-500. */
export function GuideBadge({ name, className }: { name?: string; className?: string }) {
  return (
    <StatusPill
      tone="neutral"
      title={name ? `In the ${name} collection guide` : "Guide watch"}
      className={className}
    >
      {name ?? "Guide"}
    </StatusPill>
  )
}

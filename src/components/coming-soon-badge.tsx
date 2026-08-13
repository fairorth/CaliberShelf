import { StatusPill } from "@/components/ui/status-pill"

/** Pill marking a watch that's been ordered but hasn't arrived yet.
 *
 *  Brass filled — the stronger of the two status treatments, because this is
 *  the one that is actually in motion. It read as brass before but was
 *  amber-500, a literal that merely resembled the accent. */
export function ComingSoonBadge({ className }: { className?: string }) {
  return (
    <StatusPill tone="solid" className={className}>
      Coming Soon
    </StatusPill>
  )
}

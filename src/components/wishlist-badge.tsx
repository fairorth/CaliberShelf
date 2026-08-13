import { StatusPill } from "@/components/ui/status-pill"

/** Pill marking a watch that's on the wish list (not owned yet).
 *
 *  Brass outlined, against Coming Soon's brass fill: the two are differentiated
 *  by treatment, not by a second hue. This was sky-500 — the E1 violation that
 *  survived four sweeps because it was a colour literal with nothing to sweep
 *  it to. */
export function WishlistBadge({ className }: { className?: string }) {
  return (
    <StatusPill tone="outline" className={className}>
      Wish List
    </StatusPill>
  )
}

import { cn, formatCurrency } from "@/lib/utils"
import type { GainFigure } from "@/lib/queries/gain"

interface GainValueProps {
  /** computed by queries/sales.ts or portfolio.ts — never in a component. */
  gain: GainFigure | null
  currency?: string
  /** append "(+13.6%)" after the amount. */
  showPct?: boolean
  /** whole dollars for summary strips; cents for ledgers and tables. */
  wholeDollars?: boolean
  className?: string
}

/**
 * The one place gain/loss gets its colour: `--chart-2` up, `--destructive`
 * down, `--muted-foreground` for "—" when the basis is unknown (design system
 * §1; finding V3). Every other number in the app stays `--foreground` mono
 * tabular, so nothing else may take a colour from a sign.
 *
 * A null gain renders "—", never 0 and never a percentage of nothing.
 */
export function GainValue({
  gain,
  currency = "USD",
  showPct = false,
  wholeDollars = false,
  className,
}: GainValueProps) {
  if (!gain) {
    return (
      <span
        className={cn("font-mono tabular-nums text-muted-foreground", className)}
        title="No purchase price recorded, so there is no cost basis to compare against."
      >
        —
      </span>
    )
  }

  const positive = gain.cents >= 0
  return (
    <span
      className={cn(
        "font-mono tabular-nums",
        positive ? "text-chart-2" : "text-destructive",
        className
      )}
    >
      {positive ? "+" : "−"}
      {formatCurrency(Math.abs(gain.cents), currency, wholeDollars)}
      {showPct && gain.pct != null && (
        <>
          {" "}
          ({positive ? "+" : "−"}
          {Math.abs(gain.pct).toFixed(1)}%)
        </>
      )}
    </span>
  )
}

/** Just the percentage, same colour rule — for the strip sub-lines. */
export function GainPercent({
  gain,
  className,
}: {
  gain: GainFigure | null
  className?: string
}) {
  if (!gain || gain.pct == null) return null
  const positive = gain.cents >= 0
  return (
    <span className={cn("font-mono tabular-nums", className)}>
      {positive ? "+" : "−"}
      {Math.abs(gain.pct).toFixed(1)}%
    </span>
  )
}

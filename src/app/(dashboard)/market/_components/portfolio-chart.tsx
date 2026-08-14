"use client"

import {
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  ReferenceLine,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { formatCurrency } from "@/lib/utils"

export interface PortfolioChartPoint {
  /** ms epoch of the run date — numeric so runs space by real time. */
  t: number
  valueCents: number
}

interface PortfolioChartProps {
  points: PortfolioChartPoint[]
  /** flat cost-basis reference line for the same set of watches. */
  basisCents: number
}

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]

function monthLabel(t: number): string {
  return MONTHS[new Date(t).getMonth()]
}

/** "47.3k" — the mock's compact axis/point label. */
function compactMoney(cents: number): string {
  const dollars = cents / 100
  if (Math.abs(dollars) >= 1000) return `${(dollars / 1000).toFixed(1)}k`
  return dollars.toFixed(0)
}

function PortfolioTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: PortfolioChartPoint }>
}) {
  if (!active || !payload || payload.length === 0) return null
  const p = payload[0].payload
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-md">
      <p className="font-mono text-2xs uppercase tracking-wide text-muted-foreground">
        {new Date(p.t).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })}
      </p>
      <p className="font-mono text-xs tabular-nums text-foreground">
        {formatCurrency(p.valueCents, "USD", true)}
      </p>
    </div>
  )
}

/**
 * Portfolio value over time (§3.2 block 2): one point per valuation run,
 * cost basis as a flat reference beneath. Data blue for value, a dashed
 * neutral rule for basis — never a second accent. The caller only renders
 * this with ≥2 points.
 */
export function PortfolioChart({ points, basisCents }: PortfolioChartProps) {
  const values = points.map((p) => p.valueCents)
  const min = Math.min(...values, basisCents)
  const max = Math.max(...values, basisCents)
  const pad = Math.max((max - min) * 0.12, 1000)

  return (
    <ResponsiveContainer width="100%" height={200}>
      <ComposedChart data={points} margin={{ top: 12, right: 64, bottom: 4, left: 8 }}>
        <XAxis
          dataKey="t"
          type="number"
          scale="time"
          domain={["dataMin", "dataMax"]}
          // One label per run, not per even time slice — runs are monthly and
          // sparse, so Recharts' automatic ticks leave most points unlabelled.
          // preserveStartEnd drops colliding middles once a year has stacked up.
          ticks={points.map((p) => p.t)}
          interval="preserveStartEnd"
          tickFormatter={monthLabel}
          tick={{
            fill: "var(--muted-foreground)",
            fontSize: 11,
            fontFamily: "var(--font-jetbrains-mono)",
          }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis hide domain={[min - pad, max + pad]} />
        <Tooltip content={<PortfolioTooltip />} cursor={{ stroke: "var(--border)" }} />
        <ReferenceLine
          y={basisCents}
          stroke="var(--muted-foreground)"
          strokeDasharray="4 4"
          label={{
            value: compactMoney(basisCents),
            position: "right",
            fill: "var(--muted-foreground)",
            fontSize: 11,
            fontFamily: "var(--font-jetbrains-mono)",
          }}
        />
        <Area
          dataKey="valueCents"
          stroke="var(--primary)"
          strokeWidth={2}
          fill="var(--primary)"
          fillOpacity={0.09}
          dot={{ r: 3, fill: "var(--primary)", strokeWidth: 0 }}
          activeDot={{ r: 5 }}
          isAnimationActive={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

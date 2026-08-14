"use client"

import {
  ComposedChart,
  Area,
  Line,
  Scatter,
  XAxis,
  YAxis,
  ReferenceLine,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { formatCurrency } from "@/lib/utils"

/** One agent estimate, chart-ready (built server-side in market-panel). */
export interface TrendPoint {
  /** ms epoch of valued_at — numeric so the x-axis spaces by real time. */
  t: number
  mid: number
  /** [low, high] band in cents; null when the run had no range. */
  band: [number, number] | null
}

/** One manually logged value (00046) — plotted as a hollow marker. */
export interface ManualPoint {
  t: number
  mid: number
  note: string
}

interface MarketTrendChartProps {
  points: TrendPoint[]
  manualPoints: ManualPoint[]
  /** cost-basis reference line; null when the purchase price is unknown. */
  basisCents: number | null
  /** target-ask reference line (dashed brass); null when unset. */
  targetAskCents: number | null
}

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]

function monthLabel(t: number): string {
  const d = new Date(t)
  return MONTHS[d.getMonth()]
}

function fullDate(t: number): string {
  return new Date(t).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

/** Hollow circle for manual values — visibly not an agent point (§3.3). */
function HollowDot(props: { cx?: number; cy?: number }) {
  const { cx, cy } = props
  if (cx == null || cy == null) return null
  return (
    <circle
      cx={cx}
      cy={cy}
      r={4}
      fill="var(--card)"
      stroke="var(--foreground)"
      strokeWidth={1.5}
    />
  )
}

interface TooltipPayloadEntry {
  payload: TrendPoint | (ManualPoint & { manual: true })
}

function TrendTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: TooltipPayloadEntry[]
}) {
  if (!active || !payload || payload.length === 0) return null
  const p = payload[0].payload
  const manual = "manual" in p && p.manual
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-md">
      <p className="font-mono text-2xs uppercase tracking-wide text-muted-foreground">
        {fullDate(p.t)}
        {manual ? " · logged by you" : ""}
      </p>
      <p className="font-mono text-xs tabular-nums text-foreground">
        {formatCurrency(p.mid, "USD", true)}
        {!manual && (p as TrendPoint).band
          ? ` · ${formatCurrency((p as TrendPoint).band![0], "USD", true)}–${formatCurrency((p as TrendPoint).band![1], "USD", true)}`
          : ""}
      </p>
      {manual && (
        <p className="mt-0.5 max-w-[220px] text-xs text-muted-foreground">
          {(p as ManualPoint).note}
        </p>
      )}
    </div>
  )
}

/**
 * The Market panel's trend zone (§3.3): agent mids as a data-blue line with a
 * shaded low/high band, cost basis dashed neutral, target ask dashed brass,
 * manual values as hollow circles. The caller only renders this with ≥2 agent
 * points — below that the single-value display stands in.
 */
export function MarketTrendChart({
  points,
  manualPoints,
  basisCents,
  targetAskCents,
}: MarketTrendChartProps) {
  // One flat domain so the reference lines are always inside the plot.
  const values: number[] = []
  for (const p of points) {
    values.push(p.band ? p.band[0] : p.mid, p.band ? p.band[1] : p.mid)
  }
  for (const m of manualPoints) values.push(m.mid)
  if (basisCents != null) values.push(basisCents)
  if (targetAskCents != null) values.push(targetAskCents)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const pad = Math.max((max - min) * 0.08, 100)

  const manualData = manualPoints.map((m) => ({ ...m, manual: true as const }))

  return (
    <div className="flex flex-col gap-2">
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart
          data={points}
          margin={{ top: 8, right: 92, bottom: 4, left: 8 }}
        >
          <XAxis
            dataKey="t"
            type="number"
            scale="time"
            domain={["dataMin", "dataMax"]}
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
          <Tooltip content={<TrendTooltip />} cursor={{ stroke: "var(--border)" }} />
          <Area
            dataKey="band"
            stroke="none"
            fill="var(--primary)"
            fillOpacity={0.12}
            isAnimationActive={false}
            activeDot={false}
          />
          {basisCents != null && (
            <ReferenceLine
              y={basisCents}
              stroke="var(--muted-foreground)"
              strokeDasharray="4 4"
              label={{
                value: `BASIS ${Math.round(basisCents / 100).toLocaleString()}`,
                position: "right",
                fill: "var(--muted-foreground)",
                fontSize: 11,
                fontFamily: "var(--font-jetbrains-mono)",
              }}
            />
          )}
          {targetAskCents != null && (
            <ReferenceLine
              y={targetAskCents}
              stroke="var(--brass)"
              strokeDasharray="5 4"
              label={{
                value: `ASK ${Math.round(targetAskCents / 100).toLocaleString()}`,
                position: "right",
                fill: "var(--brass)",
                fontSize: 11,
                fontFamily: "var(--font-jetbrains-mono)",
              }}
            />
          )}
          <Line
            dataKey="mid"
            stroke="var(--primary)"
            strokeWidth={2}
            dot={{ r: 3.5, fill: "var(--primary)", strokeWidth: 0 }}
            isAnimationActive={false}
          />
          <Scatter
            data={manualData}
            dataKey="mid"
            shape={<HollowDot />}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-4 font-mono text-2xs uppercase tracking-wide text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded-sm bg-primary" aria-hidden="true" />
          Agent estimate
        </span>
        {manualPoints.length > 0 && (
          <span className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full border-[1.5px] border-foreground"
              aria-hidden="true"
            />
            Logged by you
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-4 rounded-sm bg-primary/20" aria-hidden="true" />
          Low–high band
        </span>
      </div>
    </div>
  )
}

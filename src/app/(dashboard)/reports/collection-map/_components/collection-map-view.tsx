import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { CollectionMap, DistBar } from "@/lib/collection-map"
import { tierIndexFor } from "@/lib/tiers"

// Magnitude fill (single hue) via the app's brass token so it tracks the theme.
function brass(pct: number): string {
  return `color-mix(in oklab, var(--brass) ${Math.round(pct)}%, transparent)`
}

// A dial-color swatch. Empty hex = "unspecified" → dashed outline.
function Swatch({ hex, size = 12 }: { hex: string; size?: number }) {
  return (
    <span
      className={hex ? "inline-block rounded-full border border-black/10 dark:border-white/15" : "inline-block rounded-full border border-dashed border-muted-foreground/50"}
      style={{ width: size, height: size, backgroundColor: hex || "transparent" }}
    />
  )
}

// Horizontal bar list. `colored` uses each bar's real hue (the color chart);
// otherwise a single brass magnitude hue.
function BarList({ bars, colored }: { bars: DistBar[]; colored?: boolean }) {
  const max = Math.max(1, ...bars.map((b) => b.count))
  return (
    <div className="space-y-1.5">
      {bars.map((b) => {
        const w = (b.count / max) * 100
        const fill =
          colored && b.hex ? b.hex : colored && !b.hex ? undefined : brass(70)
        return (
          <div key={b.key} className="flex items-center gap-2 text-sm" title={`${b.count} · ${b.label}`}>
            <span className="flex w-28 shrink-0 items-center gap-1.5 text-muted-foreground">
              {colored && <Swatch hex={b.hex ?? ""} />}
              <span className="truncate">{b.label}</span>
            </span>
            <span className="h-3.5 flex-1 overflow-hidden rounded bg-muted/40">
              <span
                className={`block h-full rounded ${fill ? "" : "border border-dashed border-muted-foreground/40"}`}
                style={{
                  width: `${Math.max(w, b.count > 0 ? 4 : 0)}%`,
                  backgroundColor: fill,
                }}
              />
            </span>
            <span className="w-6 text-right tabular-nums text-muted-foreground">{b.count}</span>
          </div>
        )
      })}
    </div>
  )
}

function DistCard({ title, bars, colored }: { title: string; bars: DistBar[]; colored?: boolean }) {
  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <BarList bars={bars} colored={colored} />
      </CardContent>
    </Card>
  )
}

// ── Size × Color matrix ──────────────────────────────────────────
function Matrix({ map }: { map: CollectionMap }) {
  return (
    <div className="overflow-x-auto">
      <table className="border-separate border-spacing-1">
        <thead>
          <tr>
            <th className="sticky left-0 bg-card" />
            {map.matrixCols.map((c) => (
              <th key={c.key} className="align-bottom px-0.5 pb-1">
                <div className="flex flex-col items-center gap-1">
                  <Swatch hex={c.hex} />
                  <span className="w-12 truncate text-center text-[10px] leading-tight text-muted-foreground">
                    {c.label.split(" ")[0]}
                  </span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {map.matrixRows.map((r, ri) => (
            <tr key={r.key}>
              <th className="sticky left-0 bg-card pr-2 text-right text-xs font-medium text-muted-foreground">
                {r.label}
              </th>
              {map.matrixCols.map((c, ci) => {
                const cell = map.matrix[ri][ci]
                const pct = map.matrixMax > 0 ? (cell.count / map.matrixMax) * 85 + (cell.count > 0 ? 15 : 0) : 0
                return (
                  <td key={c.key} className="p-0">
                    <div
                      title={`${cell.count} watch${cell.count === 1 ? "" : "es"} · ${r.label} · ${c.label}${cell.labels.length ? `\n${cell.labels.join("\n")}` : ""}`}
                      className="flex h-9 w-12 items-center justify-center rounded text-xs tabular-nums"
                      style={{
                        backgroundColor: cell.count > 0 ? brass(pct) : "transparent",
                        outline: cell.count === 0 ? "1px dashed color-mix(in oklab, var(--muted-foreground) 25%, transparent)" : "none",
                        outlineOffset: "-1px",
                      }}
                    >
                      {cell.count > 0 ? cell.count : ""}
                    </div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Diameter × Thickness scatter ─────────────────────────────────
function Scatter({ map }: { map: CollectionMap }) {
  const pts = map.scatter
  if (pts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Not enough data yet — this plots watches that have both a case diameter and
        a thickness recorded.
      </p>
    )
  }
  const W = 640
  const H = 340
  const pad = { l: 44, r: 16, t: 12, b: 36 }
  const xs = pts.map((p) => p.diameter)
  const ys = pts.map((p) => p.thickness)
  const xMin = Math.floor(Math.min(...xs) - 1)
  const xMax = Math.ceil(Math.max(...xs) + 1)
  const yMin = Math.floor(Math.min(...ys) - 1)
  const yMax = Math.ceil(Math.max(...ys) + 1)
  const sx = (v: number) => pad.l + ((v - xMin) / (xMax - xMin)) * (W - pad.l - pad.r)
  const sy = (v: number) => H - pad.b - ((v - yMin) / (yMax - yMin)) * (H - pad.t - pad.b)

  const xticks = axisTicks(xMin, xMax)
  const yticks = axisTicks(yMin, yMax)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Case diameter versus thickness scatter">
      {/* gridlines */}
      {xticks.map((t) => (
        <line key={`gx${t}`} x1={sx(t)} y1={pad.t} x2={sx(t)} y2={H - pad.b} stroke="currentColor" className="text-border/40" strokeWidth={1} />
      ))}
      {yticks.map((t) => (
        <line key={`gy${t}`} x1={pad.l} y1={sy(t)} x2={W - pad.r} y2={sy(t)} stroke="currentColor" className="text-border/40" strokeWidth={1} />
      ))}
      {/* axes labels */}
      {xticks.map((t) => (
        <text key={`tx${t}`} x={sx(t)} y={H - pad.b + 16} textAnchor="middle" className="fill-muted-foreground text-[10px]">
          {t}
        </text>
      ))}
      {yticks.map((t) => (
        <text key={`ty${t}`} x={pad.l - 8} y={sy(t) + 3} textAnchor="end" className="fill-muted-foreground text-[10px]">
          {t}
        </text>
      ))}
      <text x={(pad.l + W - pad.r) / 2} y={H - 4} textAnchor="middle" className="fill-muted-foreground text-[11px]">
        Case diameter (mm)
      </text>
      <text x={12} y={(pad.t + H - pad.b) / 2} textAnchor="middle" className="fill-muted-foreground text-[11px]" transform={`rotate(-90 12 ${(pad.t + H - pad.b) / 2})`}>
        Thickness (mm)
      </text>
      {/* points */}
      {pts.map((p) => (
        <circle
          key={p.id}
          cx={sx(p.diameter)}
          cy={sy(p.thickness)}
          r={5}
          fill={p.hex}
          stroke="var(--card)"
          strokeWidth={1.25}
        >
          <title>{`${p.label}\n${p.diameter}mm × ${p.thickness}mm · ${p.colorLabel}`}</title>
        </circle>
      ))}
    </svg>
  )
}

function axisTicks(min: number, max: number): number[] {
  const span = max - min
  const step = span <= 8 ? 2 : span <= 16 ? 4 : 5
  const ticks: number[] = []
  for (let t = Math.ceil(min / step) * step; t <= max; t += step) ticks.push(t)
  return ticks
}

// ── Price × Category scatter (strip plot) ────────────────────────
function fmtPrice(cents: number): string {
  const d = cents / 100
  if (d >= 1000) return `$${(d / 1000).toFixed(d % 1000 === 0 ? 0 : 1)}k`
  return `$${Math.round(d)}`
}
function PriceCategoryScatter({ map }: { map: CollectionMap }) {
  const { categories, points } = map.priceCategory
  const bands = map.tierBands
  if (points.length === 0 || categories.length === 0) {
    return <p className="text-sm text-muted-foreground">No priced watches to plot yet.</p>
  }
  const W = 640
  const H = 340
  const pad = { l: 68, r: 12, t: 12, b: 62 }
  const plotBottom = H - pad.b
  // Each price tier gets equal vertical space (the sub-top majority spreads out).
  const bandH = (plotBottom - pad.t) / bands.length
  // Open-ended top tier: spread its watches up to the real max (≥$10k headroom).
  const maxDollar = Math.max(...points.map((p) => p.priceCents / 100))
  const topCap = Math.max(maxDollar, 10000)

  // Position within a tier proportionally to where the price falls in its range,
  // so ordering is preserved and tiers don't just stack dots on one line.
  const yFor = (cents: number) => {
    const d = cents / 100
    const i = tierIndexFor(cents, bands)
    const lo = bands[i].lo
    const hi = i === bands.length - 1 ? topCap : bands[i].hi
    const f = hi > lo ? Math.min(Math.max((d - lo) / (hi - lo), 0), 1) : 0.5
    return plotBottom - i * bandH - f * bandH
  }

  const bandW = (W - pad.l - pad.r) / categories.length
  const cx = (ci: number) => pad.l + bandW * ci + bandW / 2

  // Deterministic horizontal jitter so stacked prices don't fully overlap.
  const perCat = new Map<number, number>()
  const jittered = points.map((p) => {
    const n = perCat.get(p.catIndex) ?? 0
    perCat.set(p.catIndex, n + 1)
    return { p, order: n }
  })
  const catCounts = new Map<number, number>()
  for (const p of points) catCounts.set(p.catIndex, (catCounts.get(p.catIndex) ?? 0) + 1)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Price by category scatter">
      {/* Equal-height tier separators + labels */}
      {bands.map((b, i) => {
        const top = plotBottom - (i + 1) * bandH
        const center = plotBottom - (i + 0.5) * bandH
        return (
          <g key={b.tier}>
            <line x1={pad.l} y1={top} x2={W - pad.r} y2={top} stroke="currentColor" className="text-border/40" strokeWidth={1} />
            <text x={pad.l - 8} y={center + 3} textAnchor="end" className="fill-muted-foreground text-[10px]">
              {b.short}
            </text>
          </g>
        )
      })}
      <line x1={pad.l} y1={plotBottom} x2={W - pad.r} y2={plotBottom} stroke="currentColor" className="text-border/40" strokeWidth={1} />
      {categories.map((name, ci) => (
        <text
          key={`cx${ci}`}
          x={cx(ci)}
          y={H - pad.b + 14}
          textAnchor="end"
          className="fill-muted-foreground text-[10px]"
          transform={`rotate(-30 ${cx(ci)} ${H - pad.b + 14})`}
        >
          {name.length > 12 ? name.slice(0, 11) + "…" : name}
        </text>
      ))}
      {jittered.map(({ p, order }) => {
        const n = catCounts.get(p.catIndex) ?? 1
        const spread = Math.min((bandW * 0.6) / Math.max(n - 1, 1), 9)
        const jx = cx(p.catIndex) + (order - (n - 1) / 2) * spread
        return (
          <circle key={p.id} cx={jx} cy={yFor(p.priceCents)} r={4.5} fill={p.hex} stroke="var(--card)" strokeWidth={1.25}>
            <title>{`${p.label}\n${fmtPrice(p.priceCents)} · ${categories[p.catIndex]} · ${p.colorLabel}`}</title>
          </circle>
        )
      })}
    </svg>
  )
}

// ── Report ───────────────────────────────────────────────────────
export function CollectionMapView({ map }: { map: CollectionMap }) {
  const sized = map.total - map.missingSize
  const colored = map.total - map.missingColor
  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        {map.total} owned {map.total === 1 ? "watch" : "watches"} · {sized} sized · {colored} with a dial color.
        Where is the collection dense, and where are the open lanes?
      </p>

      {/* Gap / overload insights */}
      {map.insights.length > 0 && (
        <Card className="overflow-hidden rounded-2xl border-l-2 border-l-brass/40">
          <CardHeader className="bg-brass/5 pb-2">
            <CardTitle className="font-display text-[17px] font-semibold">What the map shows</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5 text-sm">
              {map.insights.map((s, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-brass">•</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Size × Color matrix — the headline */}
      <Card className="overflow-hidden rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Size × dial color</CardTitle>
        </CardHeader>
        <CardContent>
          <Matrix map={map} />
          <p className="mt-2 text-xs text-muted-foreground">
            Darker = more watches. Dashed = empty (a gap). Hover a cell for the watches in it.
          </p>
        </CardContent>
      </Card>

      {/* Distributions */}
      <div className="grid gap-3 sm:grid-cols-2">
        <DistCard title="Case size" bars={map.sizeDist} />
        <DistCard title="Dial color" bars={map.colorDist} colored />
        <DistCard title="Category" bars={map.categoryDist} />
        <DistCard title="Thickness" bars={map.thicknessDist} />
        <DistCard title="Complications" bars={map.complicationDist} />
        <DistCard title="Tier" bars={map.tierDist} />
      </div>

      {/* Scatters — widget-sized, two across */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="overflow-hidden rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Diameter × thickness</CardTitle>
          </CardHeader>
          <CardContent>
            <Scatter map={map} />
            <p className="mt-2 text-xs text-muted-foreground">
              Each dot a watch, colored by dial — your comfort-zone cluster.
            </p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Price × category</CardTitle>
          </CardHeader>
          <CardContent>
            <PriceCategoryScatter map={map} />
            <p className="mt-2 text-xs text-muted-foreground">
              Where spend concentrates across categories.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

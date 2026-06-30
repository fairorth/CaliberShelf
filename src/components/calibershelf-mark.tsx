import { useId } from "react"
import { cn } from "@/lib/utils"

/**
 * CaliberShelf brand mark — two meshing brass gears with a ruby jewel on a navy
 * gradient. Vector twin of the app/home-screen icon (see public/icons/* and the
 * memory note "calibershelf-icon"). Self-contained SVG; gradient ids are scoped
 * per instance via useId so multiple marks can render on one page.
 */

function gearPath(
  cx: number, cy: number, teeth: number, rTip: number, rRoot: number,
  tipFrac = 0.42, phase = 0
): string {
  const step = (Math.PI * 2) / teeth
  const tip = step * tipFrac
  const pt = (r: number, a: number) =>
    `${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`
  let d = ""
  for (let i = 0; i < teeth; i++) {
    const c = phase + i * step
    const a1 = c - step / 2, a2 = c - tip / 2, a3 = c + tip / 2, a4 = c + step / 2
    d += (i === 0 ? "M" : "L") + pt(rRoot, a1) + "L" + pt(rTip, a2) + "L" + pt(rTip, a3) + "L" + pt(rRoot, a4)
  }
  return d + "Z"
}

function spokePaths(
  cx: number, cy: number, n: number, rHub: number, rRim: number, hw: number, phase = 0
): string[] {
  const out: string[] = []
  for (let i = 0; i < n; i++) {
    const a = phase + (i * Math.PI * 2) / n
    const nx = Math.cos(a + Math.PI / 2), ny = Math.sin(a + Math.PI / 2)
    const dx = Math.cos(a), dy = Math.sin(a)
    const p = (r: number, w: number) =>
      `${(cx + dx * r + nx * w).toFixed(2)} ${(cy + dy * r + ny * w).toFixed(2)}`
    out.push(`M${p(rHub, hw)} L${p(rRim, hw * 0.7)} L${p(rRim, -hw * 0.7)} L${p(rHub, -hw)} Z`)
  }
  return out
}

// Precompute geometry once (matches the icon generator exactly).
const BIG = { cx: 212, cy: 296 }
const SMALL = { cx: 350, cy: 188 }
const BIG_GEAR = gearPath(BIG.cx, BIG.cy, 13, 150, 126, 0.42, -Math.PI / 2)
const BIG_SPOKES = spokePaths(BIG.cx, BIG.cy, 5, 34, 108, 17, -Math.PI / 2)
const SMALL_GEAR = gearPath(SMALL.cx, SMALL.cy, 9, 104, 84, 0.42, Math.PI / 9)
const SMALL_SPOKES = spokePaths(SMALL.cx, SMALL.cy, 4, 24, 70, 13, 0)

interface CaliberShelfMarkProps {
  /** Rendered px size (square). */
  size?: number
  className?: string
}

export function CaliberShelfMark({ size = 512, className }: CaliberShelfMarkProps) {
  const uid = useId()
  const id = (n: string) => `${n}-${uid}`
  const url = (n: string) => `url(#${id(n)})`

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      role="img"
      aria-label="CaliberShelf"
    >
      <defs>
        <linearGradient id={id("bg")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1d2f4d" />
          <stop offset="0.55" stopColor="#101a2c" />
          <stop offset="1" stopColor="#090e17" />
        </linearGradient>
        <radialGradient id={id("glow")} cx="0.5" cy="0.38" r="0.72">
          <stop offset="0" stopColor="#33507d" stopOpacity="0.55" />
          <stop offset="1" stopColor="#33507d" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id("brassR")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f1da9f" />
          <stop offset="0.5" stopColor="#c9a25e" />
          <stop offset="1" stopColor="#8f6a2c" />
        </linearGradient>
        <linearGradient id={id("brass")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f1da9f" />
          <stop offset="0.5" stopColor="#c9a25e" />
          <stop offset="1" stopColor="#8f6a2c" />
        </linearGradient>
        <radialGradient id={id("face")} cx="0.5" cy="0.42" r="0.72">
          <stop offset="0" stopColor="#16263f" />
          <stop offset="1" stopColor="#0a1320" />
        </radialGradient>
      </defs>

      <rect width="512" height="512" fill={url("bg")} />
      <rect width="512" height="512" fill={url("glow")} />

      {/* Large gear */}
      <path d={BIG_GEAR} fill={url("brassR")} />
      <circle cx={BIG.cx} cy={BIG.cy} r="108" fill={url("face")} />
      {BIG_SPOKES.map((d, i) => (
        <path key={`bs-${i}`} d={d} fill={url("brass")} />
      ))}
      <circle cx={BIG.cx} cy={BIG.cy} r="38" fill={url("brassR")} />
      <circle cx={BIG.cx} cy={BIG.cy} r="14" fill="#0a1320" />

      {/* Small gear */}
      <path d={SMALL_GEAR} fill={url("brassR")} />
      <circle cx={SMALL.cx} cy={SMALL.cy} r="70" fill={url("face")} />
      {SMALL_SPOKES.map((d, i) => (
        <path key={`ss-${i}`} d={d} fill={url("brass")} />
      ))}
      <circle cx={SMALL.cx} cy={SMALL.cy} r="28" fill={url("brassR")} />
      {/* Ruby jewel */}
      <circle cx={SMALL.cx} cy={SMALL.cy} r="13" fill="#b3243a" />
      <circle cx={SMALL.cx - 4} cy={SMALL.cy - 4} r="4" fill="#ff8fa3" opacity="0.8" />
    </svg>
  )
}

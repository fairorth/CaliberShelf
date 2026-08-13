import { cn } from "@/lib/utils"

/**
 * TenTenLoupe brand marks. Geometry is transcribed from
 * `design_handoff_v2_design_remediation/brand/BRAND.md` and matches the SVGs in
 * `public/brand/` exactly — a six-blade iris with a minimalist dial in the
 * aperture, hour hand to 10 and minute hand to 2.
 *
 * Colour comes from theme tokens, never hex. BRAND.md calls the accent "brass",
 * which in this design system is `--brass` (action), NOT `--primary` — primary
 * is the steel-blue reserved for data. `--brass` already resolves to the deeper
 * brass on light surfaces, which is what BRAND.md asks for.
 */

/** Blade wedges, alternating heavy/light, six from 0°. */
const BLADES: ReadonlyArray<{ d: string; heavy: boolean }> = [
  { d: "M50 50 L97 50 A47 47 0 0 1 73.5 90.7 Z", heavy: true },
  { d: "M50 50 L73.5 90.7 A47 47 0 0 1 26.5 90.7 Z", heavy: false },
  { d: "M50 50 L26.5 90.7 A47 47 0 0 1 3 50 Z", heavy: true },
  { d: "M50 50 L3 50 A47 47 0 0 1 26.5 9.3 Z", heavy: false },
  { d: "M50 50 L26.5 9.3 A47 47 0 0 1 73.5 9.3 Z", heavy: true },
  { d: "M50 50 L73.5 9.3 A47 47 0 0 1 97 50 Z", heavy: false },
]

/** Flat-top hexagon aperture, circumradius 36. */
const APERTURE = "M83 50 L66.5 78.58 L33.5 78.58 L17 50 L33.5 21.42 L66.5 21.42 Z"

/** Double index at 12, singles at 3, 6, 9. */
const INDICES: ReadonlyArray<{ x: number; y: number; w: number; h: number }> = [
  { x: 47.6, y: 19, w: 1.6, h: 8 },
  { x: 50.8, y: 19, w: 1.6, h: 8 },
  { x: 73, y: 49.2, w: 7, h: 1.6 },
  { x: 49.2, y: 73, w: 1.6, h: 7 },
  { x: 20, y: 49.2, w: 7, h: 1.6 },
]

/**
 * Below this size the dial indices stop resolving and turn the aperture into
 * mud, so they are omitted entirely. Hard rule from BRAND.md — the `-small`
 * asset variants exist for exactly this reason.
 */
export const MARK_INDEX_MIN_SIZE = 26

interface MarkProps {
  /** Rendered px size (square). Drives the index rule above. */
  size?: number
  className?: string
  /** Set when a sibling already names the brand, to avoid a doubled label. */
  decorative?: boolean
}

export function Mark({ size = 32, className, decorative = false }: MarkProps) {
  const showIndices = size >= MARK_INDEX_MIN_SIZE

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      role={decorative ? "presentation" : "img"}
      aria-label={decorative ? undefined : "TenTenLoupe"}
      aria-hidden={decorative ? "true" : undefined}
    >
      {/* Opaque, never alpha. Alpha blades were authored against the navy
          ground; over a light surface they collapse to a grey disc with a
          white centre. The two facet tokens carry the per-ground values —
          BRAND.md "Fills by ground". */}
      {BLADES.map((blade, i) => (
        <path
          key={i}
          d={blade.d}
          fill={blade.heavy ? "var(--mark-facet-deep)" : "var(--mark-facet-light)"}
        />
      ))}

      {/* The aperture reads as the dial face — the surface behind the glass. */}
      <path d={APERTURE} fill="var(--card)" />

      {showIndices &&
        INDICES.map((ix, i) => (
          <rect
            key={i}
            x={ix.x}
            y={ix.y}
            width={ix.w}
            height={ix.h}
            rx={0.8}
            fill="var(--foreground)"
          />
        ))}

      {/* Hour to 10, minute to 2. The minute hand is always the longer one. */}
      <line
        x1="50" y1="50" x2="30.95" y2="39"
        stroke="var(--foreground)" strokeWidth="2.4" strokeLinecap="round"
      />
      <line
        x1="50" y1="50" x2="75.11" y2="35.5"
        stroke="var(--foreground)" strokeWidth="2" strokeLinecap="round"
      />

      <circle cx="50" cy="50" r="3.4" fill="var(--mark-pinion)" />
      <circle cx="50" cy="50" r="48" fill="none" stroke="var(--brass)" strokeWidth="2" />
    </svg>
  )
}

/**
 * The wordmark alone, in the one place it is defined.
 *
 * The colon and LOUPE are the only two brass elements in the wordmark, and
 * they carry the whole 10:10 reference — so they must never be a copy that can
 * drift. `inline` lays Ten:Ten and LOUPE on one line for height-constrained
 * surfaces like the 56px header, where the three-line stack does not fit.
 */
export function Wordmark({
  inline = false,
  className,
}: {
  inline?: boolean
  className?: string
}) {
  const tenTen = (
    <span className="font-display text-md font-semibold tracking-[-0.02em] text-foreground">
      Ten<span className="text-brass">:</span>Ten
    </span>
  )

  if (inline) {
    return (
      <span className={cn("flex items-baseline gap-1.5", className)}>
        {tenTen}
        <span className="font-mono text-2xs font-medium tracking-[0.24em] text-brass">
          LOUPE
        </span>
      </span>
    )
  }

  return (
    <span className={cn("flex flex-col leading-none", className)}>
      {tenTen}
      {/* Hairline: transparent → brass → transparent, per the lockup spec. */}
      <span
        aria-hidden="true"
        className="my-1 h-px w-full bg-gradient-to-r from-transparent via-brass/75 to-transparent"
      />
      {/* pad-left matches the tracking so the word optically centres — mono
          tracking adds a trailing gap after the final E that nothing balances. */}
      <span className="pl-[0.46em] font-mono text-2xs font-medium tracking-[0.46em] text-brass">
        LOUPE
      </span>
    </span>
  )
}

interface LogoProps {
  orientation?: "horizontal" | "stacked"
  /** Mark size in px; the wordmark scales with the surrounding type. */
  markSize?: number
  className?: string
}

/**
 * Mark + wordmark. The wordmark is real text, never an image, so it stays
 * selectable, searchable and crisp at any zoom: `Ten`, a brass colon, `Ten`,
 * a hairline rule, then `LOUPE` in the mono face.
 *
 * The colon is the only brass in the wordmark (BRAND.md).
 */
export function Logo({
  orientation = "horizontal",
  markSize = 32,
  className,
}: LogoProps) {
  const wordmark = <Wordmark />

  if (orientation === "stacked") {
    return (
      <span className={cn("inline-flex flex-col items-center gap-2.5", className)}>
        <Mark size={markSize} decorative />
        {wordmark}
      </span>
    )
  }

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <Mark size={markSize} decorative />
      {wordmark}
    </span>
  )
}

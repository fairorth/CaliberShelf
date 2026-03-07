import { cn } from "@/lib/utils"

interface CaliberShelfLogoProps {
  className?: string
  /** Size in pixels — the SVG viewBox is square */
  size?: number
  /** Gold index color for the dial, or any fill color */
  color?: string
}

/**
 * CaliberShelf logo — a stylized balance wheel with integrated "CS" monogram.
 *
 * The balance wheel is the beating heart of every mechanical watch.
 * Four spokes radiate from the center, with a hairspring-inspired
 * circular element and elegant CS lettering.
 *
 * Designed to sit on the watch dial below 12 o'clock.
 */
export function CaliberShelfLogo({
  className,
  size = 48,
  color = "oklch(0.85 0.03 85)",
}: CaliberShelfLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      fill="none"
      className={cn("shrink-0", className)}
      aria-label="CaliberShelf logo"
      role="img"
    >
      {/* Outer balance wheel rim */}
      <circle
        cx="50"
        cy="50"
        r="44"
        stroke={color}
        strokeWidth="1.5"
        opacity="0.9"
      />

      {/* Inner timing ring */}
      <circle
        cx="50"
        cy="50"
        r="36"
        stroke={color}
        strokeWidth="0.75"
        opacity="0.4"
        strokeDasharray="3.5 3.5"
      />

      {/* Four balance wheel spokes — the classic cross pattern */}
      {/* Top spoke */}
      <line
        x1="50" y1="6" x2="50" y2="20"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.8"
      />
      {/* Bottom spoke */}
      <line
        x1="50" y1="80" x2="50" y2="94"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.8"
      />
      {/* Left spoke */}
      <line
        x1="6" y1="50" x2="20" y2="50"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.8"
      />
      {/* Right spoke */}
      <line
        x1="80" y1="50" x2="94" y2="50"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.8"
      />

      {/* Hairspring spiral — the soul of the movement */}
      <path
        d="M 50 26 A 24 24 0 1 1 26 50"
        stroke={color}
        strokeWidth="0.75"
        strokeLinecap="round"
        opacity="0.3"
      />
      <path
        d="M 50 30 A 20 20 0 1 0 70 50"
        stroke={color}
        strokeWidth="0.5"
        strokeLinecap="round"
        opacity="0.2"
      />

      {/* Four timing adjustment screws on the rim — characteristic detail */}
      <circle cx="50" cy="8" r="2" fill={color} opacity="0.6" />
      <circle cx="92" cy="50" r="2" fill={color} opacity="0.6" />
      <circle cx="50" cy="92" r="2" fill={color} opacity="0.6" />
      <circle cx="8" cy="50" r="2" fill={color} opacity="0.6" />

      {/* CS monogram — elegant serif-inspired letterforms */}
      {/* Letter C */}
      <path
        d="M 45 40 C 38 40, 33 44.5, 33 50 C 33 55.5, 38 60, 45 60"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        opacity="0.95"
      />

      {/* Letter S */}
      <path
        d="M 65 42 C 62 39, 56 39, 54 42 C 52 45, 56 48, 60 50 C 64 52, 68 55, 66 58 C 64 61, 58 61, 55 58"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.95"
      />

      {/* Center jewel — the pivot point */}
      <circle
        cx="50"
        cy="50"
        r="3"
        fill={color}
        opacity="0.15"
      />
      <circle
        cx="50"
        cy="50"
        r="1.5"
        fill={color}
        opacity="0.5"
      />
    </svg>
  )
}

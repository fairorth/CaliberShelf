import { cn } from "@/lib/utils"

/**
 * The one definition of a status pill.
 *
 * Every badge in the app used to hand-roll its own Tailwind colour literal —
 * sky-500 here, amber-500 there, violet-500 somewhere else — which is why a
 * non-brass accent survived four sweeps: there was nothing to sweep *to*.
 * Brass is the only accent (design system §1), so status is differentiated by
 * treatment, never by inventing a second hue.
 *
 * - `solid`   brass fill — the strongest state, for something in motion
 * - `outline` brass outline, no fill — same family, one step quieter
 * - `neutral` muted surface — classification, not status
 * - `danger`  the one semantic exception, for failure only
 *
 * All four resolve from palette tokens, so they follow the theme and cannot
 * drift out of the palette again.
 */
export type StatusTone = "solid" | "outline" | "neutral" | "danger"

const TONES: Record<StatusTone, string> = {
  solid: "bg-brass/15 text-brass ring-1 ring-brass/35",
  outline: "text-brass ring-1 ring-brass/45",
  neutral: "bg-muted text-muted-foreground ring-1 ring-border",
  danger: "bg-destructive/12 text-destructive ring-1 ring-destructive/30",
}

export function StatusPill({
  tone = "neutral",
  className,
  title,
  children,
}: {
  tone?: StatusTone
  className?: string
  title?: string
  children: React.ReactNode
}) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-2xs font-semibold uppercase tracking-wide",
        TONES[tone],
        className
      )}
    >
      {children}
    </span>
  )
}

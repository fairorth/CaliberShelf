import { cn } from "@/lib/utils"

/** Pill marking a watch that belongs to a Master Collection Guide — shows the
 *  guide's name so the strategic tier is visible at a glance. */
export function GuideBadge({ name, className }: { name: string; className?: string }) {
  return (
    <span
      title={`In the ${name} collection guide`}
      className={cn(
        "inline-flex items-center rounded-full bg-violet-500/15 px-2 py-0.5 text-2xs font-semibold uppercase tracking-wide text-violet-700 ring-1 ring-violet-500/30 dark:text-violet-400",
        className
      )}
    >
      {name}
    </span>
  )
}

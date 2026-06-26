import { cn } from "@/lib/utils"

/** Pill marking a watch that's been ordered but hasn't arrived yet. */
export function ComingSoonBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 ring-1 ring-amber-500/30 dark:text-amber-400",
        className
      )}
    >
      Coming Soon
    </span>
  )
}

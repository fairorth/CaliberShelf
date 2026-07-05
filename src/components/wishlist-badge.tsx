import { cn } from "@/lib/utils"

/** Pill marking a watch that's on the wish list (not owned yet). */
export function WishlistBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-sky-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-700 ring-1 ring-sky-500/30 dark:text-sky-400",
        className
      )}
    >
      Wish List
    </span>
  )
}

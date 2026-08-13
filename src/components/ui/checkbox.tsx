import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Design-system checkbox. Built on the native input so keyboard, label and
 * form semantics come for free; `accent-brass` paints the checked fill with
 * the single action accent (design system §1). Never `accent-primary` — steel
 * blue is data only (charts, links, info chips), never a control (E1).
 */
function Checkbox({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type="checkbox"
      data-slot="checkbox"
      className={cn(
        "h-4 w-4 shrink-0 rounded border border-input accent-brass outline-none transition-shadow",
        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Checkbox }

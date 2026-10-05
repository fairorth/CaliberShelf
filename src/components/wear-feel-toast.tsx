"use client"

import { toast } from "sonner"
import { WearFeelPicker } from "@/components/wear-feel-picker"

/**
 * After a one-press "Wore today", ask how it felt — in the toast, so the
 * answer costs one more click and nothing else. Ignoring it is fine: the wear
 * is logged either way, and the Wear Log's history takes the answer later.
 */
export function confirmWearAndAskFeel(logId: string | undefined, name: string) {
  if (!logId) {
    toast.success(`${name} — wear logged.`)
    return
  }
  toast.custom(
    (id) => (
      <div className="flex w-[340px] flex-col gap-2 rounded-xl border border-border bg-card p-3 shadow-lg">
        <p className="text-sm text-foreground">{name} — wear logged.</p>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">How did it feel?</span>
          <WearFeelPicker logId={logId} value={null} onSaved={() => toast.dismiss(id)} />
        </div>
      </div>
    ),
    { duration: 12_000 }
  )
}

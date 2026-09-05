"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { PencilLine } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { logManualValuation } from "@/lib/actions/sales"
import { manualValuationSchema } from "@/lib/validations/sale"
import { toast } from "sonner"

interface LogValueDialogProps {
  watchId: string
}

const CONFIDENCE_OPTIONS = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
] as const

/**
 * "Log a value" (V7) — a manual valuation row.
 *
 * Since v1.10.3 it is not a footnote: a logged value BECOMES the watch's
 * current value (newest of agent|manual wins) and counts in portfolio totals,
 * until a later price check supersedes it. Before that it was written to the
 * database and rendered nowhere, which made the button a lie.
 */
export function LogValueDialog({ watchId }: LogValueDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState("")
  const [confidence, setConfidence] = useState<"high" | "medium" | "low">("medium")
  const [note, setNote] = useState("")
  const [pending, startTransition] = useTransition()

  function submit() {
    const input = { value_mid: value, confidence, entered_note: note }
    const parsed = manualValuationSchema.safeParse(input)
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message)
      return
    }
    startTransition(async () => {
      const result = await logManualValuation(watchId, input)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Value logged.")
        setOpen(false)
        setValue("")
        setNote("")
        router.refresh()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" className="gap-1.5" />}>
        <PencilLine className="h-4 w-4" aria-hidden="true" />
        Log a value
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Log a value</DialogTitle>
          <DialogDescription>
            Your own observation. It becomes this watch&rsquo;s current value —
            on the watch page, in the collection and in your portfolio total —
            until a newer price check replaces it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="manual_value">
              Value ($) <span className="text-brass">*</span>
            </Label>
            <Input
              id="manual_value"
              type="number"
              step="0.01"
              min="0"
              placeholder="e.g. 4200.00"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="font-mono tabular-nums"
            />
          </div>

          <div className="space-y-2">
            <Label>Confidence</Label>
            <div
              role="radiogroup"
              aria-label="Confidence"
              className="inline-flex overflow-hidden rounded-lg border border-border"
            >
              {CONFIDENCE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={confidence === opt.value}
                  onClick={() => setConfidence(opt.value)}
                  className={
                    confidence === opt.value
                      ? "bg-brass/15 px-3.5 py-1.5 text-sm font-medium text-brass [&:not(:first-child)]:border-l [&:not(:first-child)]:border-border"
                      : "px-3.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground [&:not(:first-child)]:border-l [&:not(:first-child)]:border-border"
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="manual_note">
              Where the number came from <span className="text-brass">*</span>
            </Label>
            <Textarea
              id="manual_note"
              placeholder="e.g. saw one sell at RedBar for 4.2"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={pending}
            className="bg-brass text-brass-foreground hover:bg-brass/90"
          >
            {pending ? "Saving…" : "Log it"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

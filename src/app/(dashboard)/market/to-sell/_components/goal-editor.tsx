"use client"

import { useState, useTransition } from "react"
import { Target } from "lucide-react"
import { toast } from "sonner"
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
import { saveSaleGoal } from "@/lib/actions/keep-actions"
import { saleGoalSchema } from "@/lib/validations/keep"
import type { SaleGoal } from "@/lib/queries/to-sell"

export function GoalEditor({ goal }: { goal: SaleGoal }) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState(goal.goalCents != null ? String(goal.goalCents / 100) : "")
  const [label, setLabel] = useState(goal.label ?? "")
  const [fee, setFee] = useState(String(goal.feePct))
  const [pending, startTransition] = useTransition()

  function save() {
    const input = {
      goal: amount.trim() === "" ? null : Number(amount.replace(/[$,]/g, "")),
      label,
      feePct: Number(fee),
    }
    // Same schema as the server — validated on both sides.
    const parsed = saleGoalSchema.safeParse(input)
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message)
      return
    }
    startTransition(async () => {
      const res = await saveSaleGoal(parsed.data)
      if (res.error) toast.error(res.error)
      else {
        toast.success("Goal saved")
        setOpen(false)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Target className="h-4 w-4" aria-hidden="true" />
        {goal.goalCents != null ? "Edit goal" : "Set a goal"}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sale goal</DialogTitle>
          <DialogDescription>
            What the sell list should raise. Changing the amount restarts which sales count toward it.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="goal-amount">Amount (USD)</Label>
            <Input
              id="goal-amount"
              inputMode="decimal"
              placeholder="25000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="goal-label">For</Label>
            <Input
              id="goal-label"
              placeholder="e.g. the next grail"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="goal-fee">Selling fees (%)</Label>
            <Input
              id="goal-fee"
              inputMode="decimal"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Taken off estimates and asks, never off a recorded sale. 0 for private sales; about 8 for an
              eBay / Chrono24 mix.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={save} disabled={pending}>
            {pending ? "Saving…" : "Save goal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

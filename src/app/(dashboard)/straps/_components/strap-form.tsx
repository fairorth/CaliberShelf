"use client"

import { useActionState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createStrap, updateStrap } from "@/lib/actions/strap-actions"
import type { StrapActionState } from "@/lib/actions/strap-actions"
import { strapMaterialLabels } from "@/lib/validations/strap"
import type { Strap } from "@/lib/types/strap"
import type { WatchOption } from "@/lib/queries/straps"

interface StrapFormProps {
  /** Present for edit; absent for create. */
  strap?: Strap
  watches: WatchOption[]
  submitLabel: string
}

function centsToDollarString(cents: number | null): string {
  return cents != null ? String(cents / 100) : ""
}

export function StrapForm({ strap, watches, submitLabel }: StrapFormProps) {
  const action = strap ? updateStrap.bind(null, strap.id) : createStrap
  const [state, formAction, isPending] = useActionState<StrapActionState, FormData>(
    action,
    {}
  )

  return (
    <form action={formAction} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Strap Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="strap-name">Name</Label>
            <Input
              id="strap-name"
              name="name"
              defaultValue={strap?.name ?? ""}
              placeholder='e.g. "Elite Silicone – Navy"'
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="strap-manufacturer">Manufacturer</Label>
            <Input
              id="strap-manufacturer"
              name="manufacturer"
              defaultValue={strap?.manufacturer ?? ""}
              placeholder="e.g. Barton, Cartier, Uncle Seiko"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="strap-material">
              Material <span className="text-brass">*</span>
            </Label>
            <Select name="material" defaultValue={strap?.material ?? "leather"}>
              <SelectTrigger id="strap-material" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(strapMaterialLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="strap-color">Color</Label>
            <Input
              id="strap-color"
              name="color"
              defaultValue={strap?.color ?? ""}
              placeholder="e.g. Navy, Tan, Black"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="strap-width">
              Width (mm) <span className="text-brass">*</span>
            </Label>
            <Input
              id="strap-width"
              name="width_mm"
              type="number"
              step="0.5"
              min="6"
              max="30"
              required
              defaultValue={strap?.width_mm ?? ""}
              placeholder="e.g. 20"
            />
          </div>
          <div className="flex flex-col justify-end gap-2 pb-1">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="quick_release"
                defaultChecked={strap?.quick_release ?? false}
                className="h-4 w-4 rounded border-border accent-brass"
              />
              <span>Quick-release spring bars</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="micro_adjust"
                defaultChecked={strap?.micro_adjust ?? false}
                className="h-4 w-4 rounded border-border accent-brass"
              />
              <span>Tool-free micro adjustment</span>
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Source & Mounting</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="strap-source">Source</Label>
            <Input
              id="strap-source"
              name="source"
              defaultValue={strap?.source ?? ""}
              placeholder="e.g. StrapsCo, AD, gift"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="strap-source-watch">Came with watch</Label>
            <Select name="source_watch_id" defaultValue={strap?.source_watch_id ?? ""}>
              <SelectTrigger id="strap-source-watch" className="w-full">
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">—</SelectItem>
                {watches.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="strap-current-watch">Currently mounted on</Label>
            <Select name="current_watch_id" defaultValue={strap?.current_watch_id ?? ""}>
              <SelectTrigger id="strap-current-watch" className="w-full">
                <SelectValue placeholder="— not mounted" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">— not mounted</SelectItem>
                {watches.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.label}
                    {w.strap_width_mm != null ? ` · ${w.strap_width_mm}mm lugs` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Mounting here dismounts whatever strap is on that watch now.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Purchase</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="strap-purchase-date">Purchase date</Label>
            <Input
              id="strap-purchase-date"
              name="purchase_date"
              type="date"
              defaultValue={strap?.purchase_date ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="strap-purchase-price">Purchase price (USD)</Label>
            <Input
              id="strap-purchase-price"
              name="purchase_price"
              type="number"
              step="0.01"
              min="0"
              defaultValue={centsToDollarString(strap?.purchase_price_cents ?? null)}
              placeholder="e.g. 45"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="strap-notes">Notes</Label>
            <Textarea
              id="strap-notes"
              name="notes"
              defaultValue={strap?.notes ?? ""}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : submitLabel}
        </Button>
        <Button variant="outline" render={<Link href="/straps" />}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

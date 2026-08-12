"use client"

import { useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import { setWatchStrap } from "@/lib/actions/strap-actions"
import { toast } from "sonner"
import type { StrapWithDetails } from "@/lib/types/strap"

interface StrapPanelProps {
  watchId: string
  /** The watch's lug width — drives the "fits" hint on each option. */
  watchStrapWidthMm: number | null
  /** All of the user's straps (list-shaped, with cover thumbs). */
  straps: StrapWithDetails[]
  strapLabels: Record<string, string>
}

export function StrapPanel({ watchId, watchStrapWidthMm, straps, strapLabels }: StrapPanelProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const current = straps.find((s) => s.current_watch_id === watchId) ?? null

  // Fitting straps first, then by width; a strap mounted elsewhere still shows
  // (mounting it here steals it, which the label calls out).
  const options = [...straps].sort((a, b) => {
    const aFits = watchStrapWidthMm != null && a.width_mm === watchStrapWidthMm ? 0 : 1
    const bFits = watchStrapWidthMm != null && b.width_mm === watchStrapWidthMm ? 0 : 1
    return aFits - bFits || a.width_mm - b.width_mm
  })

  function mount(strapId: string | null) {
    startTransition(async () => {
      const result = await setWatchStrap(watchId, strapId)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(strapId ? "Strap mounted" : "Strap dismounted")
        router.refresh()
      }
    })
  }

  function optionLabel(s: StrapWithDetails): string {
    const fits = watchStrapWidthMm != null && s.width_mm === watchStrapWidthMm
    const elsewhere = s.current_watch && s.current_watch_id !== watchId
    return [
      strapLabels[s.id] ?? "Strap",
      `· ${s.width_mm}mm`,
      fits ? "✓" : "",
      elsewhere ? `(on ${s.current_watch!.nickname || s.current_watch!.model})` : "",
    ]
      .filter(Boolean)
      .join(" ")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">
          Strap
          {watchStrapWidthMm != null && (
            <span className="ml-2 font-mono text-xs font-normal text-muted-foreground">
              {watchStrapWidthMm}mm lugs
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {current ? (
          <div className="flex items-center gap-3">
            {current.cover_photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={current.cover_photo_url}
                alt=""
                className="h-12 w-12 shrink-0 rounded-md border object-cover"
              />
            ) : (
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border bg-muted text-md opacity-60">
                〰️
              </span>
            )}
            <div className="min-w-0 flex-1">
              <Link
                href={`/straps/${current.id}/edit`}
                className="block truncate text-sm font-medium underline-offset-2 hover:text-primary hover:underline"
              >
                {strapLabels[current.id] ?? "Strap"}
              </Link>
              <p className="font-mono text-xs text-muted-foreground">
                {current.width_mm}mm
                {current.quick_release && " · quick release"}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => mount(null)}
              disabled={isPending}
            >
              Dismount
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No strap recorded on this watch.</p>
        )}

        {straps.length > 0 ? (
          <Select
            key={current?.id ?? "none"}
            value=""
            onValueChange={(val) => {
              if (val) mount(val)
            }}
          >
            <SelectTrigger className="w-full" disabled={isPending}>
              <span className="text-muted-foreground">
                {isPending ? "Updating..." : "Mount a strap..."}
              </span>
            </SelectTrigger>
            <SelectContent>
              {options
                .filter((s) => s.id !== current?.id)
                .map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {optionLabel(s)}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        ) : (
          <p className="text-xs text-muted-foreground">
            No straps yet —{" "}
            <Link href="/straps/new" className="text-primary underline-offset-2 hover:underline">
              add one
            </Link>
            .
          </p>
        )}
      </CardContent>
    </Card>
  )
}

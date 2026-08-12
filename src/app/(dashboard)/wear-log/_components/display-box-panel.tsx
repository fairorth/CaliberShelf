"use client"

import { Archive, Package } from "lucide-react"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { createDisplayBox } from "@/lib/actions/display-box-actions"
import { DISPLAY_BOX_SIZE } from "@/lib/display-box"
import type { CurrentDisplayBox } from "@/lib/queries/display-box"

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function DisplayBoxPanel({ box }: { box: CurrentDisplayBox | null }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function generate() {
    startTransition(async () => {
      const res = await createDisplayBox()
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success("Display box assembled!")
        router.refresh()
      }
    })
  }

  return (
    <Card className="overflow-hidden rounded-xl">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-2.5 font-display text-md font-semibold">
          <span className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-muted text-sm">
            <Package className="h-4 w-4" aria-hidden="true" />
          </span>
          Weekly Display Box
        </CardTitle>
        <Button size="sm" onClick={generate} disabled={isPending}>
          {isPending ? "Assembling…" : box ? "Regenerate" : "Create Display Box"}
        </Button>
      </CardHeader>
      <CardContent>
        {!box ? (
          <p className="py-2 text-sm text-muted-foreground">
            Assemble a balanced set of {DISPLAY_BOX_SIZE} watches for the week — favoring
            pieces you haven&apos;t worn lately, with a spread of categories, price tiers, and
            complications. Each pick shows its permanent box number so you can pull them
            straight from the safe.
          </p>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              {box.watches.length} watches · assembled {formatDate(box.createdAt)}
              {box.rationale ? ` · ${box.rationale}` : ""}
            </p>
            <ul className="divide-y divide-border/50">
              {box.watches.map((w) => (
                <li
                  key={w.watchId}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5"
                >
                  <span
                    className="inline-flex h-6 min-w-[3.5rem] items-center justify-center rounded-md bg-muted px-2 font-mono text-xs font-semibold text-foreground"
                    title="Permanent storage box"
                  >
                    {w.box ? <><Archive className="mr-1 inline h-3 w-3" aria-hidden="true" />{w.box}</> : "—"}
                  </span>
                  <Link
                    href={`/watch/${w.watchId}`}
                    className="font-medium hover:text-primary"
                  >
                    {w.name}
                    {w.nickname ? (
                      <span className="text-muted-foreground"> · {w.nickname}</span>
                    ) : null}
                  </Link>
                  {w.reason && (
                    <span className="ml-auto text-xs text-muted-foreground">{w.reason}</span>
                  )}
                </li>
              ))}
            </ul>
            <p className="pt-1 text-xs text-muted-foreground">
              Load these into your case for the week — the box number tells you where each
              one lives in the safe.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

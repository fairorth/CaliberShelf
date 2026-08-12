import type { Metadata } from "next"
import Link from "next/link"
import { Camera, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getPhotoLabCoverage } from "@/lib/queries/photo-lab"
import { PhotoLabTabs } from "./_components/photo-lab-tabs"
import { CoverageMatrix } from "./_components/coverage-matrix"

export const metadata: Metadata = {
  title: "Photo Lab | CaliberShelf",
}

export const dynamic = "force-dynamic"

/** Photo Lab · Coverage — "what do I shoot tonight" in one glance (D1). */
export default async function PhotoLabPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const [{ filter }, coverage] = await Promise.all([searchParams, getPhotoLabCoverage()])
  const total = coverage.rows.length

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="font-display text-lg font-semibold tracking-tight">Photo Lab</h1>
          <p className="text-sm text-muted-foreground">
            <span className="text-foreground">{coverage.heroCovered}</span> of{" "}
            <span className="text-foreground">{total}</span> watches have a hero angle ·{" "}
            <span className="text-foreground">{coverage.noPhotoAtAll}</span> have no photo at
            all · <span className="text-foreground">{coverage.awaitingReview}</span> frames
            awaiting review
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            render={<Link href="/photo-lab?filter=never-shot" />}
            className="gap-1.5"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Reshoot list
            <span className="font-mono text-xs tabular-nums text-muted-foreground">
              {coverage.reshootCount}
            </span>
          </Button>
          <Button
            render={<Link href="/photo-lab/session" />}
            className="gap-1.5 bg-brass text-brass-foreground hover:bg-brass/90"
          >
            <Camera className="h-4 w-4" aria-hidden="true" />
            Start session
          </Button>
        </div>
      </div>

      <PhotoLabTabs reviewCount={coverage.awaitingReview} />

      <CoverageMatrix rows={coverage.rows} initialNeverShot={filter === "never-shot"} />
    </div>
  )
}

import type { Metadata } from "next"
import { getWatches } from "@/lib/queries/watches"
import { QuickCapture } from "./_components/quick-capture"

export const metadata: Metadata = {
  title: "Quick Capture | TenTenLoupe",
}

export const dynamic = "force-dynamic"

/**
 * Quick Capture — the phone shutter for a watch already in the collection
 * (D3). This route redirected to /add from March 2026, which orphaned the D3
 * rewrite and sent Photo Lab's "Open capture" to Add Watch instead
 * (mobile-app.md B6). Adding a NEW watch from the camera is /add; this is
 * more frames of one you own.
 */
export default async function CapturePage() {
  const watches = await getWatches()
  // Frames for watches in hand: not wish-list rows, and not sold ones (sold
  // watches are outside every Photo Lab coverage target).
  const inHand = watches.filter((w) => !w.is_wishlist && w.sale_status !== "sold")

  return (
    <div className="mx-auto max-w-[640px] space-y-6">
      <div>
        <h1 className="font-display text-lg font-semibold tracking-tight">
          Quick Capture
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Phone frames for a watch you own. They upload untagged — tag the angle
          in the watch page&rsquo;s photo viewer.
        </p>
      </div>

      <QuickCapture watches={inHand} />
    </div>
  )
}

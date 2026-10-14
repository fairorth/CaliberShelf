import type { Metadata } from "next"
import Link from "next/link"
import { getAdmiredWatches } from "@/lib/queries/admired"
import { getInspirationImages } from "@/lib/queries/inspiration"
import { cn } from "@/lib/utils"
import { AdmiredBoard } from "./_components/admired-board"
import { InspirationGallery } from "./_components/inspiration-gallery"

export const metadata: Metadata = {
  title: "Inspiration | TenTenLoupe",
}

export const dynamic = "force-dynamic"

type Tab = "photography" | "admired"

/**
 * Inspiration has two halves: Photography (the mood board for the photo lab)
 * and Admired (watches seen and admired, not to be owned — 00056). The tab
 * lives in the URL (?tab=admired) so it survives a refresh and is linkable.
 */
export default async function InspirationPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab: tabParam } = await searchParams
  const tab: Tab = tabParam === "admired" ? "admired" : "photography"

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h1 className="font-display text-lg font-semibold tracking-tight">Inspiration</h1>
        <nav aria-label="Inspiration" className="inline-flex rounded-lg border border-border bg-card p-1">
          <TabLink href="/inspiration" active={tab === "photography"}>
            Photography
          </TabLink>
          <TabLink href="/inspiration?tab=admired" active={tab === "admired"}>
            Admired
          </TabLink>
        </nav>
      </div>

      {tab === "photography" ? <PhotographyTab /> : <AdmiredTab />}
    </div>
  )
}

function TabLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "rounded-md px-3.5 py-1.5 text-sm transition-colors duration-150",
        active ? "bg-brass/14 font-medium text-brass" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </Link>
  )
}

async function PhotographyTab() {
  const images = await getInspirationImages()
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Watch photography worth learning from — a mood board for the photo lab.{" "}
        {images.length > 0 && (
          <>
            {images.length} {images.length === 1 ? "image" : "images"} ·{" "}
          </>
        )}
        Paste a copied image anywhere on this page (Ctrl+V) to add it.
      </p>
      <InspirationGallery images={images} />
    </div>
  )
}

async function AdmiredTab() {
  const watches = await getAdmiredWatches()
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Watches seen in the metal and admired — not the wish list. Captured on the iPhone in Show mode; the
        placard fills in what it can.
      </p>
      <AdmiredBoard watches={watches} />
    </div>
  )
}

import type { Metadata } from "next"
import { getInspirationImages } from "@/lib/queries/inspiration"
import { InspirationGallery } from "./_components/inspiration-gallery"

export const metadata: Metadata = {
  title: "Inspiration | TenTenLoupe",
}

export const dynamic = "force-dynamic"

export default async function InspirationPage() {
  const images = await getInspirationImages()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-lg font-semibold tracking-tight">
          Inspiration
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Watch photography worth learning from — a mood board for the photo lab.{" "}
          {images.length > 0 && (
            <>
              {images.length} {images.length === 1 ? "image" : "images"} ·{" "}
            </>
          )}
          Paste a copied image anywhere on this page (Ctrl+V) to add it.
        </p>
      </div>

      <InspirationGallery images={images} />
    </div>
  )
}

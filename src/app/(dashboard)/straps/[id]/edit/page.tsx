import Link from "next/link"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getStrapById, getWatchOptions } from "@/lib/queries/straps"
import { strapMaterialLabels } from "@/lib/validations/strap"
import { strapDisplayName } from "@/lib/types/strap"
import { StrapForm } from "../../_components/strap-form"
import { StrapPhotoManager } from "../../_components/strap-photo-manager"
import { DeleteStrapButton } from "../../_components/delete-strap-button"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const strap = await getStrapById(id)
  if (!strap) return { title: "Strap Not Found | TenTenLoupe" }
  return {
    title: `Edit ${strapDisplayName(strap, strapMaterialLabels[strap.material])} | TenTenLoupe`,
  }
}

export default async function EditStrapPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [strap, watches] = await Promise.all([getStrapById(id), getWatchOptions()])
  if (!strap) notFound()

  const displayName = strapDisplayName(strap, strapMaterialLabels[strap.material])

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/straps"
          className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ‹ Straps
        </Link>
        <h1 className="font-display text-lg font-semibold tracking-tight">
          {displayName}{" "}
          <span className="font-mono text-xs text-muted-foreground">{strap.width_mm}mm</span>
        </h1>
        {strap.current_watch && (
          <p className="mt-1 text-sm text-brass">
            Currently on {strap.current_watch.brand_name} {strap.current_watch.nickname || strap.current_watch.model}
          </p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr] lg:items-start">
        {/* Left: photos */}
        <Card className="lg:sticky lg:top-[calc(3.5rem+1.5rem)]">
          <CardHeader>
            <CardTitle className="text-sm">Photos</CardTitle>
          </CardHeader>
          <CardContent>
            <StrapPhotoManager strapId={strap.id} photos={strap.photos} />
          </CardContent>
        </Card>

        {/* Right: form + delete */}
        <div className="space-y-6">
          <StrapForm strap={strap} watches={watches} submitLabel="Save Changes" />
          <div className="flex justify-end border-t pt-4">
            <DeleteStrapButton strapId={strap.id} name={displayName} />
          </div>
        </div>
      </div>
    </div>
  )
}

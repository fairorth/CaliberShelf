import type { Metadata } from "next"
import { Suspense } from "react"
import { getEditData } from "@/lib/queries/keep"
import { EditHeader } from "@/components/edit-header"
import { FaceoffArena } from "./_components/faceoff-arena"

export const metadata: Metadata = {
  title: "Head-to-head | TenTenLoupe",
}

export const dynamic = "force-dynamic"

export default async function FaceoffPage() {
  const data = await getEditData()
  return (
    <div className="space-y-5 pb-8">
      <EditHeader
        title="Head-to-head"
        subtitle="If you could keep only one of these two, which? Only look-alikes near the cut line are asked."
      />
      <Suspense fallback={null}>
        <FaceoffArena data={data} />
      </Suspense>
    </div>
  )
}

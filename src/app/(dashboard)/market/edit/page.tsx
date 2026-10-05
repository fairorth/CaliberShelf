import type { Metadata } from "next"
import { Suspense } from "react"
import { getEditData } from "@/lib/queries/keep"
import { EditHeader } from "@/components/edit-header"
import { EditBoard } from "./_components/edit-board"

export const metadata: Metadata = {
  title: "The Edit | TenTenLoupe",
}

export const dynamic = "force-dynamic"

export default async function TheEditPage() {
  const data = await getEditData()
  const unrated = data.watches.filter((w) => !w.attachment).length

  return (
    <div className="space-y-5 pb-8">
      <EditHeader
        title="The Edit"
        subtitle={
          <>
            {data.watches.length} watches owned or coming ·{" "}
            {unrated > 0 ? `${unrated} not yet rated` : "every watch rated"}
          </>
        }
      />
      <Suspense fallback={null}>
        <EditBoard data={data} />
      </Suspense>
    </div>
  )
}

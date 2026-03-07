import { notFound } from "next/navigation"
import Link from "next/link"
import { getDisplayCaseById } from "@/lib/queries/display-cases"
import { DisplayCaseView } from "@/components/display-case-view"
import { Button } from "@/components/ui/button"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const displayCase = await getDisplayCaseById(id)
  if (!displayCase) return { title: "Case Not Found | CaliberShelf" }
  return {
    title: `${displayCase.name} | CaliberShelf`,
  }
}

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const displayCase = await getDisplayCaseById(id)

  if (!displayCase) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" render={<Link href="/dashboard" />}>
          &larr; Gallery
        </Button>
        <Button variant="outline" size="sm" render={<Link href="/config" />}>
          Edit Case
        </Button>
      </div>

      <DisplayCaseView displayCase={displayCase} />
    </div>
  )
}

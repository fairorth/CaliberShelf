import { notFound } from "next/navigation"
import Link from "next/link"
import { getCategoryById } from "@/lib/queries/categories"
import { CollectionTable } from "@/components/collection-table"
import { Button } from "@/components/ui/button"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const category = await getCategoryById(id)
  if (!category) return { title: "Category Not Found | CaliberShelf" }
  return {
    title: `${category.name} | CaliberShelf`,
  }
}

export default async function CategoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const category = await getCategoryById(id)

  if (!category) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" render={<Link href="/dashboard" />}>
          &larr; Gallery
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">{category.name}</h1>
        {category.description && (
          <p className="mt-1 text-sm text-muted-foreground">{category.description}</p>
        )}
        <p className="mt-1 text-sm text-muted-foreground">
          {category.watches.length} {category.watches.length === 1 ? "watch" : "watches"}
        </p>
      </div>

      <CollectionTable watches={category.watches} />
    </div>
  )
}

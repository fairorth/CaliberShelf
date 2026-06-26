import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getCategories } from "@/lib/queries/categories"
import { BatchImportForm } from "./_components/batch-import-form"

export const metadata: Metadata = {
  title: "Batch Import | CaliberShelf",
}

export default async function BatchImportPage() {
  const categories = await getCategories()

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" render={<Link href="/dashboard" />}>
          &larr; Home
        </Button>
        <h1 className="font-display text-lg font-medium tracking-tight">Batch Import</h1>
      </div>

      <BatchImportForm categories={categories} />
    </div>
  )
}

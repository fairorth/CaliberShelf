import { redirect } from "next/navigation"

/**
 * Legacy route — the per-category page has been folded into /collection
 * via its ?category=<id> query param. Kept here as a permanent redirect
 * so old links, bookmarks, and the iPhone PWA cache continue to work.
 */
export default async function CategoryRedirect({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  redirect(`/collection?category=${id}`)
}

import { redirect } from "next/navigation"

// The view-only detail page was retired — the edit page is now the single
// watch page. Redirect so old links (and any missed internal ones) keep working.
export default async function WatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  redirect(`/watch/${id}/edit`)
}

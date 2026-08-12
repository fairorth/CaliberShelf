import type { Metadata } from "next"
import { getPhotoLabReview } from "@/lib/queries/photo-lab"
import { PhotoLabTabs } from "../_components/photo-lab-tabs"
import { ReviewSession } from "./_components/review-session"

export const metadata: Metadata = {
  title: "Photo Lab · Review | CaliberShelf",
}

export const dynamic = "force-dynamic"

/** Photo Lab · Review — judge scored frames at size, fast, keyboard-first. */
export default async function PhotoLabReviewPage() {
  const review = await getPhotoLabReview()
  const unreviewed = review.frames.filter(
    (f) => (f.review_state ?? "unreviewed") === "unreviewed"
  ).length

  return (
    <div className="space-y-5">
      <h1 className="font-display text-lg font-semibold tracking-tight">Photo Lab</h1>
      <PhotoLabTabs reviewCount={unreviewed} />
      <ReviewSession frames={review.frames} lastRun={review.lastRun} />
    </div>
  )
}

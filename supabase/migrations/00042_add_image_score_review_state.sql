-- 00042_add_image_score_review_state.sql
-- Photo Lab Review (v2 Phase 3, finding D1): reviewing scored frames must be
-- resumable, so each watch_image_scores row carries a review state. Rejecting
-- never touches the source file on disk — it only marks the row. Accepting
-- records the promoted watch_photos row via the existing watch_photo_id.

ALTER TABLE public.watch_image_scores
  ADD COLUMN IF NOT EXISTS review_state TEXT NOT NULL DEFAULT 'unreviewed'
    CHECK (review_state IN ('unreviewed', 'accepted', 'rejected'));

ALTER TABLE public.watch_image_scores
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Review queues filter by owner + state (e.g. all unreviewed frames).
CREATE INDEX IF NOT EXISTS idx_watch_image_scores_review_state
  ON public.watch_image_scores (user_id, review_state);

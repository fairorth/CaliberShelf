-- 00059_rating_segment_schemes.sql
-- Rate My Watches v2: a game can now be segmented by Type (category), by
-- price Tier, or by Type + Tier (src/lib/rating-segments.ts). A session
-- records WHICH scheme and WHICH segment, so rankings, "you agree with Marc"
-- and the consensus compare like with like.
--
-- segment_scheme  'type' | 'tier' | 'type_tier'
-- segment_key     the segment within the scheme: a category id for 'type';
--                 "tier:2" / "tier:1-2" / "tier:unpriced" for 'tier';
--                 "<category id>|tier:…" (or "<category id>|all") for
--                 'type_tier'; "final" for a Best in Show final.
--
-- Existing sessions (all played by Type) are backfilled. category_id stays:
-- it is still set for type and type_tier segments.

ALTER TABLE public.rating_sessions
  ADD COLUMN IF NOT EXISTS segment_scheme TEXT NOT NULL DEFAULT 'type',
  ADD COLUMN IF NOT EXISTS segment_key TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'rating_sessions_segment_scheme_known'
  ) THEN
    ALTER TABLE public.rating_sessions
      ADD CONSTRAINT rating_sessions_segment_scheme_known
      CHECK (segment_scheme IN ('type', 'tier', 'type_tier'));
  END IF;
END $$;

UPDATE public.rating_sessions
SET segment_key = CASE WHEN kind = 'final' THEN 'final' ELSE category_id::text END
WHERE segment_key IS NULL;

-- Sessions without a resolvable key (a deleted category) keep their name.
UPDATE public.rating_sessions
SET segment_key = 'name:' || segment_name
WHERE segment_key IS NULL;

ALTER TABLE public.rating_sessions ALTER COLUMN segment_key SET NOT NULL;

CREATE INDEX IF NOT EXISTS rating_sessions_segment_idx
  ON public.rating_sessions (user_id, segment_scheme, segment_key, completed_at DESC);

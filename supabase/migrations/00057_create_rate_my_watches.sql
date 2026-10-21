-- 00057_create_rate_my_watches.sql
-- RATE MY WATCHES: hand the iPhone to a friend; they tap their favourite of
-- two watches, again and again, one SEGMENT (category) at a time, and a
-- pairwise model (Bradley–Terry, src/lib/rating.ts) turns the picks into
-- their ranking. Marc rates too — his sessions are the yardstick for "you
-- agree with Marc".
--
-- raters          one row per person who has played (the owner included).
-- rating_sessions one completed game of one segment (or the Best in Show
--                 final). `result` freezes the ranking at completion so a
--                 later change to the model can't silently rewrite what a
--                 friend was shown; the picks remain the source of truth and
--                 the web can re-fit them.
-- rating_picks    every tap: the pair shown and the winner (NULL = "can't
--                 choose", a tie).
--
-- Ids are CLIENT-GENERATED (the phone saves a finished session in one go,
-- and retries safely if the network drops — a repeat insert is a no-op).
-- Owner-only RLS throughout: friends never sign in; they play on Marc's
-- phone under his session.

CREATE TABLE IF NOT EXISTS public.raters (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 60),
  -- The collection's owner rating his own watches — the "agree with Marc" anchor.
  is_owner BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One rater per name (case-insensitive) per owner, so "Dave" returns as Dave.
CREATE UNIQUE INDEX IF NOT EXISTS raters_user_name_unique
  ON public.raters (user_id, lower(name));

CREATE TABLE IF NOT EXISTS public.rating_sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rater_id UUID NOT NULL REFERENCES public.raters(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('segment', 'final')),
  -- The segment's category; NULL for the Best in Show final.
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  -- Kept as text too: a renamed or deleted category must not orphan history.
  segment_name TEXT NOT NULL CHECK (char_length(segment_name) <= 80),
  watch_count INTEGER NOT NULL CHECK (watch_count >= 0),
  pick_count INTEGER NOT NULL CHECK (pick_count >= 0),
  -- [{ "watch_id": uuid, "rank": 1.., "score": number }], best first.
  result JSONB NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT rating_sessions_final_has_no_category CHECK (kind = 'segment' OR category_id IS NULL)
);

CREATE INDEX IF NOT EXISTS rating_sessions_rater_idx
  ON public.rating_sessions (user_id, rater_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS rating_sessions_category_idx
  ON public.rating_sessions (user_id, category_id, completed_at DESC);

CREATE TABLE IF NOT EXISTS public.rating_picks (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.rating_sessions(id) ON DELETE CASCADE,
  -- The pair as shown (left / right were randomised against position bias).
  left_watch_id UUID NOT NULL REFERENCES public.watches(id) ON DELETE CASCADE,
  right_watch_id UUID NOT NULL REFERENCES public.watches(id) ON DELETE CASCADE,
  -- NULL = "Can't choose" (a tie).
  winner_watch_id UUID REFERENCES public.watches(id) ON DELETE CASCADE,
  -- How long the choice took: a quick pick is a strong preference.
  decided_ms INTEGER CHECK (decided_ms IS NULL OR decided_ms >= 0),
  seq INTEGER NOT NULL CHECK (seq >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT rating_picks_distinct_pair CHECK (left_watch_id <> right_watch_id),
  CONSTRAINT rating_picks_winner_in_pair CHECK (
    winner_watch_id IS NULL OR winner_watch_id IN (left_watch_id, right_watch_id)
  )
);

CREATE INDEX IF NOT EXISTS rating_picks_session_idx ON public.rating_picks (session_id, seq);

ALTER TABLE public.raters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rating_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rating_picks ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['raters', 'rating_sessions', 'rating_picks'] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = t || '_select_owner') THEN
      EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT USING (auth.uid() = user_id)', t || '_select_owner', t);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = t || '_insert_owner') THEN
      EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT WITH CHECK (auth.uid() = user_id)', t || '_insert_owner', t);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = t || '_update_owner') THEN
      EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)', t || '_update_owner', t);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = t || '_delete_owner') THEN
      EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE USING (auth.uid() = user_id)', t || '_delete_owner', t);
    END IF;
  END LOOP;
END $$;

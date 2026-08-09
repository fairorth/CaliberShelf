-- 00038_create_collection_guides.sql
-- Master Collection Guides: a curated acquisition narrative (e.g. "Grand
-- Seiko") made of ordered entries — historical chapters a collection should
-- cover. Entries may LINK to a real watch row (owned or wish-list); a linked
-- entry's displayed status derives LIVE from the watch (owned / coming soon /
-- wish list), so there is no status sync to break. The stored status covers
-- only unlinked entries: 'candidate' (still hunting) or 'passed' (considered,
-- decided against — recorded so the decision isn't re-litigated).
--
-- This is the strategic tier of the two-tier "wanting" model; the flat
-- watches.is_wishlist tag remains the impulse tier.

CREATE TABLE IF NOT EXISTS public.collection_guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                  -- "Grand Seiko"
  thesis TEXT,                         -- "every watch must earn its place..."
  source_document TEXT,                -- e.g. the archived PDF's filename
  version TEXT,                        -- guide document version ("1.1")
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);

CREATE TABLE IF NOT EXISTS public.guide_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES public.collection_guides(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  position INTEGER NOT NULL,           -- card order within the guide
  chapter TEXT,                        -- era grouping ("Origins & Golden Age")
  title TEXT NOT NULL,                 -- "44GS", "Original Snowflake"
  reference_number TEXT,               -- "4420-9000", "SBGA011"
  caliber TEXT,                        -- "4420B - manual wind"
  year_from INTEGER,                   -- spine-timeline placement year
  dates_text TEXT,                     -- "1967-1968/69" (display)
  historical_role TEXT,
  recommended_variant TEXT,
  target_low_cents BIGINT,             -- realistic acquisition band (money = cents)
  target_high_cents BIGINT,
  priority NUMERIC(3,1),               -- 0.0-10.0 from the guide

  -- Stored status applies when watch_id is NULL; a linked entry derives its
  -- status from the watch row live.
  status TEXT NOT NULL DEFAULT 'candidate' CHECK (status IN ('candidate', 'passed')),
  watch_id UUID REFERENCES public.watches(id) ON DELETE SET NULL,

  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (guide_id, position)
);

CREATE INDEX IF NOT EXISTS guide_entries_guide_id_idx ON public.guide_entries (guide_id);
CREATE INDEX IF NOT EXISTS guide_entries_watch_id_idx ON public.guide_entries (watch_id);

-- ── RLS: owner-only, standard pattern ────────────────────────────
ALTER TABLE public.collection_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guide_entries     ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'collection_guides_select_owner') THEN
    CREATE POLICY collection_guides_select_owner ON public.collection_guides
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'collection_guides_insert_owner') THEN
    CREATE POLICY collection_guides_insert_owner ON public.collection_guides
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'collection_guides_update_owner') THEN
    CREATE POLICY collection_guides_update_owner ON public.collection_guides
      FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'collection_guides_delete_owner') THEN
    CREATE POLICY collection_guides_delete_owner ON public.collection_guides
      FOR DELETE USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'guide_entries_select_owner') THEN
    CREATE POLICY guide_entries_select_owner ON public.guide_entries
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'guide_entries_insert_owner') THEN
    CREATE POLICY guide_entries_insert_owner ON public.guide_entries
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'guide_entries_update_owner') THEN
    CREATE POLICY guide_entries_update_owner ON public.guide_entries
      FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'guide_entries_delete_owner') THEN
    CREATE POLICY guide_entries_delete_owner ON public.guide_entries
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- ── updated_at triggers (reuse existing function) ────────────────
DROP TRIGGER IF EXISTS collection_guides_updated_at ON public.collection_guides;
CREATE TRIGGER collection_guides_updated_at
  BEFORE UPDATE ON public.collection_guides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS guide_entries_updated_at ON public.guide_entries;
CREATE TRIGGER guide_entries_updated_at
  BEFORE UPDATE ON public.guide_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

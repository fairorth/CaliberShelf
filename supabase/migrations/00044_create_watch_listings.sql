-- 00044_create_watch_listings.sql
-- Phase 5, 2 of 5: listings. The table exists even under the linear
-- one-active-listing decision because it is where days-on-market and
-- price-drop history live. Relisting later needs no migration — only the UI
-- to show more than the newest row. Money is BIGINT cents.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sale_venue') THEN
    CREATE TYPE public.sale_venue AS ENUM
      ('watchexchange','redbar_austin','ebay','chrono24','forum','local','other');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.watch_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  watch_id UUID NOT NULL REFERENCES public.watches(id) ON DELETE CASCADE,
  user_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  venue public.sale_venue NOT NULL,
  venue_other TEXT,                     -- required when venue = 'other' (enforced in Zod)
  listing_url TEXT,
  listed_at DATE NOT NULL,
  ask_price_cents BIGINT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','sold','withdrawn')),
  closed_at DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- The linear model: at most one open listing per watch.
CREATE UNIQUE INDEX IF NOT EXISTS watch_listings_one_active
  ON public.watch_listings (watch_id) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS watch_listings_watch_idx
  ON public.watch_listings (watch_id, listed_at DESC);

ALTER TABLE public.watch_listings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'watch_listings_select_owner') THEN
    CREATE POLICY watch_listings_select_owner ON public.watch_listings
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'watch_listings_insert_owner') THEN
    CREATE POLICY watch_listings_insert_owner ON public.watch_listings
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'watch_listings_update_owner') THEN
    CREATE POLICY watch_listings_update_owner ON public.watch_listings
      FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'watch_listings_delete_owner') THEN
    CREATE POLICY watch_listings_delete_owner ON public.watch_listings
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- updated_at trigger (reuse existing function)
DROP TRIGGER IF EXISTS watch_listings_updated_at ON public.watch_listings;
CREATE TRIGGER watch_listings_updated_at
  BEFORE UPDATE ON public.watch_listings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

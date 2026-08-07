-- 00037_create_straps.sql
-- Strap/bracelet asset tracking (Phase One).
--
-- straps: one row per strap or bracelet the user owns. Width is the key
-- dimension (drives Phase Two's "straps that fit" matching against
-- watches.strap_width_mm). A strap may record where it came from
-- (free-text source and/or the watch it shipped with) and may be mounted on
-- at most one watch at a time (current_watch_id, partial unique index).
-- strap_photos mirrors watch_photos; images live in the existing
-- watch-photos bucket under {user_id}/straps/{strap_id}/{uuid}.{ext}, which
-- satisfies the bucket's first-folder-is-owner storage RLS.

CREATE TABLE IF NOT EXISTS public.straps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  name TEXT,                            -- optional; UI falls back to color+material
  manufacturer TEXT,                    -- "Barton", "Cartier", "Uncle Seiko", ...
  material TEXT NOT NULL,               -- validated set in src/lib/validations/strap.ts
  color TEXT,
  width_mm NUMERIC(4,1) NOT NULL,       -- lug width the strap fits (Phase Two matcher)
  quick_release BOOLEAN NOT NULL DEFAULT false,   -- quick-release spring bars
  micro_adjust BOOLEAN NOT NULL DEFAULT false,    -- tool-free micro adjustment

  source TEXT,                          -- free text: store, site, gift, ...
  source_watch_id UUID REFERENCES public.watches(id) ON DELETE SET NULL,  -- came with this watch
  current_watch_id UUID REFERENCES public.watches(id) ON DELETE SET NULL, -- mounted on this watch

  purchase_date DATE,
  purchase_price_cents BIGINT,          -- money convention: BIGINT cents
  purchase_currency TEXT NOT NULL DEFAULT 'USD',
  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- A watch wears at most one strap at a time.
CREATE UNIQUE INDEX IF NOT EXISTS straps_current_watch_unique_idx
  ON public.straps (current_watch_id)
  WHERE current_watch_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS straps_user_id_idx ON public.straps (user_id);
CREATE INDEX IF NOT EXISTS straps_source_watch_id_idx ON public.straps (source_watch_id);

CREATE TABLE IF NOT EXISTS public.strap_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strap_id UUID NOT NULL REFERENCES public.straps(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  thumb_path TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_cover BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS strap_photos_strap_id_idx ON public.strap_photos (strap_id);

-- ── RLS: owner-only, standard pattern ────────────────────────────
ALTER TABLE public.straps       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strap_photos ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'straps_select_owner') THEN
    CREATE POLICY straps_select_owner ON public.straps
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'straps_insert_owner') THEN
    CREATE POLICY straps_insert_owner ON public.straps
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'straps_update_owner') THEN
    CREATE POLICY straps_update_owner ON public.straps
      FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'straps_delete_owner') THEN
    CREATE POLICY straps_delete_owner ON public.straps
      FOR DELETE USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'strap_photos_select_owner') THEN
    CREATE POLICY strap_photos_select_owner ON public.strap_photos
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'strap_photos_insert_owner') THEN
    CREATE POLICY strap_photos_insert_owner ON public.strap_photos
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'strap_photos_update_owner') THEN
    CREATE POLICY strap_photos_update_owner ON public.strap_photos
      FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'strap_photos_delete_owner') THEN
    CREATE POLICY strap_photos_delete_owner ON public.strap_photos
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- ── updated_at trigger (reuse existing function) ─────────────────
DROP TRIGGER IF EXISTS straps_updated_at ON public.straps;
CREATE TRIGGER straps_updated_at
  BEFORE UPDATE ON public.straps
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

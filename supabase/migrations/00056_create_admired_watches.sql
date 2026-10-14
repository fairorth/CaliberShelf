-- 00056_create_admired_watches.sql
-- ADMIRED: watches seen in the metal and admired, with no intention of owning
-- them — the Indies at Watch Week NYC, a museum piece, a friend's grail. NOT
-- the wish list: the wish list means "might buy", and it drives deal checks,
-- guides and the wish-list totals; twenty covetable independents would
-- quietly pollute all of it. Lives beside Inspiration (Imagery → Inspiration
-- → Admired); captured mainly from the iPhone's Show mode.
--
-- One row per admired watch; its frames in admired_photos. A frame is either
-- a WATCH shot or the booth's PLACARD — reading the placard (server-side, a
-- vision call) fills maker / model / reference / price, but only fields still
-- empty: the owner's own edits always win.
--
-- Maker is FREE TEXT, deliberately not brands.brand_id: the brands table is
-- the owner's brands (with the wish-list tag); twenty independents seen once
-- don't belong in it. Promoting an admired watch to the wish list (later)
-- creates the brand then, and records the link in promoted_watch_id.
--
-- Photos live in the watch-photos bucket under {user_id}/admired/{admired_id}/
-- (first folder = owner, which satisfies the bucket's storage RLS — the same
-- arrangement as inspiration and straps).
--
-- Ids are CLIENT-GENERATED UUIDs on purpose: the phone queues captures with no
-- signal and retries on reconnect, so an insert must be safely repeatable —
-- a retry hits the primary key (23505) and is treated as already done.

CREATE TABLE IF NOT EXISTS public.admired_watches (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- e.g. "Watch Week NYC 2026" — the phone's Show mode stamps it.
  event TEXT CHECK (event IS NULL OR char_length(event) <= 120),
  maker TEXT CHECK (maker IS NULL OR char_length(maker) <= 120),
  model TEXT CHECK (model IS NULL OR char_length(model) <= 200),
  reference TEXT CHECK (reference IS NULL OR char_length(reference) <= 80),
  -- As printed ("CHF 48,000", "POA") — not cents: currencies vary, "POA" is
  -- common, and this is never summed.
  price_text TEXT CHECK (price_text IS NULL OR char_length(price_text) <= 80),
  notes TEXT CHECK (notes IS NULL OR char_length(notes) <= 2000),
  -- Why it caught the eye: any of design | finishing | complication | photography.
  tags TEXT[] NOT NULL DEFAULT '{}',
  -- The owner's local calendar day it was seen (the phone sends it).
  seen_on DATE NOT NULL DEFAULT CURRENT_DATE,
  -- When a placard last filled fields; NULL = never read.
  placard_read_at TIMESTAMPTZ,
  -- Set if it was later promoted to the wish list.
  promoted_watch_id UUID REFERENCES public.watches(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT admired_watches_tags_known CHECK (
    tags <@ ARRAY['design', 'finishing', 'complication', 'photography']::TEXT[]
  )
);

CREATE INDEX IF NOT EXISTS admired_watches_user_seen_idx
  ON public.admired_watches (user_id, seen_on DESC, created_at DESC);

CREATE TABLE IF NOT EXISTS public.admired_photos (
  id UUID PRIMARY KEY,
  admired_id UUID NOT NULL REFERENCES public.admired_watches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  thumb_path TEXT,
  kind TEXT NOT NULL DEFAULT 'watch' CHECK (kind IN ('watch', 'placard')),
  display_order INTEGER NOT NULL DEFAULT 0,
  image_width INTEGER,
  image_height INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admired_photos_admired_idx
  ON public.admired_photos (admired_id, display_order);

ALTER TABLE public.admired_watches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admired_photos ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admired_watches_select_owner') THEN
    CREATE POLICY admired_watches_select_owner ON public.admired_watches
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admired_watches_insert_owner') THEN
    CREATE POLICY admired_watches_insert_owner ON public.admired_watches
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admired_watches_update_owner') THEN
    CREATE POLICY admired_watches_update_owner ON public.admired_watches
      FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admired_watches_delete_owner') THEN
    CREATE POLICY admired_watches_delete_owner ON public.admired_watches
      FOR DELETE USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admired_photos_select_owner') THEN
    CREATE POLICY admired_photos_select_owner ON public.admired_photos
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  -- A photo may only be attached to an admired watch the same owner holds.
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admired_photos_insert_owner') THEN
    CREATE POLICY admired_photos_insert_owner ON public.admired_photos
      FOR INSERT WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
          SELECT 1 FROM public.admired_watches a
          WHERE a.id = admired_photos.admired_id AND a.user_id = auth.uid()
        )
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admired_photos_update_owner') THEN
    CREATE POLICY admired_photos_update_owner ON public.admired_photos
      FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admired_photos_delete_owner') THEN
    CREATE POLICY admired_photos_delete_owner ON public.admired_photos
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

DROP TRIGGER IF EXISTS admired_watches_updated_at ON public.admired_watches;
CREATE TRIGGER admired_watches_updated_at
  BEFORE UPDATE ON public.admired_watches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

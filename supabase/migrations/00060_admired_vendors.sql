-- 00060_admired_vendors.sql
-- ADMIRED, VENDOR-FIRST. At a show you walk up to a booth, shoot the watches
-- that catch your eye, shoot the booth (the sign, the watchmakers manning it),
-- then move on. So the VENDOR is the unit the phone's Show mode captures, and
-- an admired watch belongs to one:
--
--   admired_vendors   one row per booth visited (name, event, day, notes)
--   admired_watches   + vendor_id — the booth it was seen at
--   admired_photos    a frame now belongs to EITHER a watch (kind watch |
--                     placard) OR a vendor (kind booth | name). A NAME frame
--                     — their sign, banner or card — is read server-side and
--                     fills the vendor's name if it is still empty.
--
-- Ids stay CLIENT-GENERATED (00056): the phone's offline queue creates the
-- vendor, its watches and every frame, and retries on reconnect.
--
-- Backfill: within each event, existing admired watches that share a maker
-- become one vendor named after it (at Watch Week NYC the maker WAS the
-- booth). Watches with no maker stay without a vendor and show ungrouped.
-- 'placard' stays a valid kind for the frames already stored; the phone no
-- longer shoots it.

CREATE TABLE IF NOT EXISTS public.admired_vendors (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event TEXT CHECK (event IS NULL OR char_length(event) <= 120),
  name TEXT CHECK (name IS NULL OR char_length(name) <= 120),
  -- Who set the name: 'read' (a Name frame), 'owner' (typed), 'backfill' (00060).
  name_source TEXT CHECK (name_source IS NULL OR name_source IN ('read', 'owner', 'backfill')),
  notes TEXT CHECK (notes IS NULL OR char_length(notes) <= 2000),
  -- The owner's local calendar day of the visit (the phone sends it).
  seen_on DATE NOT NULL DEFAULT CURRENT_DATE,
  -- When a Name frame was last read; NULL = never.
  name_read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admired_vendors_user_seen_idx
  ON public.admired_vendors (user_id, seen_on DESC, created_at);

ALTER TABLE public.admired_vendors ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admired_vendors_select_owner') THEN
    CREATE POLICY admired_vendors_select_owner ON public.admired_vendors
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admired_vendors_insert_owner') THEN
    CREATE POLICY admired_vendors_insert_owner ON public.admired_vendors
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admired_vendors_update_owner') THEN
    CREATE POLICY admired_vendors_update_owner ON public.admired_vendors
      FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admired_vendors_delete_owner') THEN
    CREATE POLICY admired_vendors_delete_owner ON public.admired_vendors
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

DROP TRIGGER IF EXISTS admired_vendors_updated_at ON public.admired_vendors;
CREATE TRIGGER admired_vendors_updated_at
  BEFORE UPDATE ON public.admired_vendors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ── Watches belong to a vendor ─────────────────────────────────────
ALTER TABLE public.admired_watches
  ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES public.admired_vendors(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS admired_watches_vendor_idx ON public.admired_watches (vendor_id);

-- A watch may only point at a vendor the same owner holds.
DROP POLICY IF EXISTS admired_watches_insert_owner ON public.admired_watches;
CREATE POLICY admired_watches_insert_owner ON public.admired_watches
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND (
      vendor_id IS NULL
      OR EXISTS (SELECT 1 FROM public.admired_vendors v WHERE v.id = admired_watches.vendor_id AND v.user_id = auth.uid())
    )
  );
DROP POLICY IF EXISTS admired_watches_update_owner ON public.admired_watches;
CREATE POLICY admired_watches_update_owner ON public.admired_watches
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (
    auth.uid() = user_id
    AND (
      vendor_id IS NULL
      OR EXISTS (SELECT 1 FROM public.admired_vendors v WHERE v.id = admired_watches.vendor_id AND v.user_id = auth.uid())
    )
  );

-- ── Frames: a watch's or a vendor's ────────────────────────────────
ALTER TABLE public.admired_photos ALTER COLUMN admired_id DROP NOT NULL;
ALTER TABLE public.admired_photos
  ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES public.admired_vendors(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS admired_photos_vendor_idx ON public.admired_photos (vendor_id, display_order);

-- Widen `kind`. The 00056 CHECK was created inline, so Postgres named it:
-- drop it by DEFINITION, not by an assumed name (a widened constraint added
-- beside a surviving narrow one looks fine and still rejects every insert).
DO $$
DECLARE
  c RECORD;
BEGIN
  FOR c IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.admired_photos'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%kind%'
      AND conname NOT IN ('admired_photos_kind_known', 'admired_photos_owner_shape')
  LOOP
    EXECUTE format('ALTER TABLE public.admired_photos DROP CONSTRAINT %I', c.conname);
  END LOOP;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'admired_photos_kind_known') THEN
    ALTER TABLE public.admired_photos ADD CONSTRAINT admired_photos_kind_known
      CHECK (kind IN ('watch', 'placard', 'booth', 'name'));
  END IF;
  -- Watch / placard frames hang off a watch; booth / name frames off a vendor.
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'admired_photos_owner_shape') THEN
    ALTER TABLE public.admired_photos ADD CONSTRAINT admired_photos_owner_shape CHECK (
      (kind IN ('watch', 'placard') AND admired_id IS NOT NULL AND vendor_id IS NULL)
      OR (kind IN ('booth', 'name') AND vendor_id IS NOT NULL AND admired_id IS NULL)
    );
  END IF;
END $$;

-- A frame may only be attached to a watch / vendor the same owner holds —
-- on insert, and on update (the phone can move a frame to another watch, or
-- turn a mis-tagged Watch frame into a Booth one).
DROP POLICY IF EXISTS admired_photos_insert_owner ON public.admired_photos;
CREATE POLICY admired_photos_insert_owner ON public.admired_photos
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND (admired_id IS NULL OR EXISTS (
      SELECT 1 FROM public.admired_watches a WHERE a.id = admired_photos.admired_id AND a.user_id = auth.uid()
    ))
    AND (vendor_id IS NULL OR EXISTS (
      SELECT 1 FROM public.admired_vendors v WHERE v.id = admired_photos.vendor_id AND v.user_id = auth.uid()
    ))
  );
DROP POLICY IF EXISTS admired_photos_update_owner ON public.admired_photos;
CREATE POLICY admired_photos_update_owner ON public.admired_photos
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (
    auth.uid() = user_id
    AND (admired_id IS NULL OR EXISTS (
      SELECT 1 FROM public.admired_watches a WHERE a.id = admired_photos.admired_id AND a.user_id = auth.uid()
    ))
    AND (vendor_id IS NULL OR EXISTS (
      SELECT 1 FROM public.admired_vendors v WHERE v.id = admired_photos.vendor_id AND v.user_id = auth.uid()
    ))
  );

-- ── Backfill: one vendor per (owner, event, maker) ─────────────────
-- Re-runnable: only watches still without a vendor are considered.
INSERT INTO public.admired_vendors (id, user_id, event, name, name_source, seen_on, created_at)
SELECT gen_random_uuid(), user_id, event, btrim(maker), 'backfill', min(seen_on), min(created_at)
FROM public.admired_watches
WHERE vendor_id IS NULL AND NULLIF(btrim(maker), '') IS NOT NULL
GROUP BY user_id, event, btrim(maker);

UPDATE public.admired_watches w
SET vendor_id = v.id
FROM public.admired_vendors v
WHERE w.vendor_id IS NULL
  AND v.name_source = 'backfill'
  AND v.user_id = w.user_id
  AND v.event IS NOT DISTINCT FROM w.event
  AND v.name = btrim(w.maker);

-- 00039_create_inspiration_images.sql
-- Inspiration Gallery: watch photography the user admires — collected as a
-- mood board for the photo lab. Images live in the watch-photos bucket under
-- {user_id}/inspiration/{uuid}.{ext} (first folder = owner satisfies the
-- bucket's storage RLS, same pattern as straps). Each image may carry a short
-- note (<= 80 chars). Personal reference material; owner-only.
-- (The photo-scoring agent's watch_image_scores table moves to 00040.)

CREATE TABLE IF NOT EXISTS public.inspiration_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  thumb_path TEXT,
  note TEXT CHECK (note IS NULL OR char_length(note) <= 80),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS inspiration_images_user_id_idx
  ON public.inspiration_images (user_id, created_at DESC);

ALTER TABLE public.inspiration_images ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'inspiration_images_select_owner') THEN
    CREATE POLICY inspiration_images_select_owner ON public.inspiration_images
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'inspiration_images_insert_owner') THEN
    CREATE POLICY inspiration_images_insert_owner ON public.inspiration_images
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'inspiration_images_update_owner') THEN
    CREATE POLICY inspiration_images_update_owner ON public.inspiration_images
      FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'inspiration_images_delete_owner') THEN
    CREATE POLICY inspiration_images_delete_owner ON public.inspiration_images
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

DROP TRIGGER IF EXISTS inspiration_images_updated_at ON public.inspiration_images;
CREATE TRIGGER inspiration_images_updated_at
  BEFORE UPDATE ON public.inspiration_images
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

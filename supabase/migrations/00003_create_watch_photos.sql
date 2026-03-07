-- Create watch_photos table for tracking photo metadata
CREATE TABLE IF NOT EXISTS public.watch_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  watch_id UUID NOT NULL REFERENCES public.watches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  caption TEXT,
  is_cover BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS watch_photos_watch_id_idx ON public.watch_photos(watch_id);
CREATE INDEX IF NOT EXISTS watch_photos_user_id_idx ON public.watch_photos(user_id);

-- Enable RLS
ALTER TABLE public.watch_photos ENABLE ROW LEVEL SECURITY;

-- Owner can view their own photos
CREATE POLICY "watch_photos_select_owner" ON public.watch_photos
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Owner can insert photos for their watches
CREATE POLICY "watch_photos_insert_owner" ON public.watch_photos
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Owner can update their own photos (reorder, set cover, edit caption)
CREATE POLICY "watch_photos_update_owner" ON public.watch_photos
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Owner can delete their own photos
CREATE POLICY "watch_photos_delete_owner" ON public.watch_photos
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Future: anyone can view photos for public watches
CREATE POLICY "watch_photos_select_public" ON public.watch_photos
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.watches
      WHERE watches.id = watch_photos.watch_id
      AND watches.is_public = true
    )
  );

-- Create storage bucket for watch photos
-- Note: Run this in the Supabase dashboard SQL editor since storage
-- bucket creation requires specific permissions.
-- Alternatively, create via the Supabase dashboard Storage UI:
--   Bucket name: watch-photos
--   Public: No (private)
--   File size limit: 5MB
--   Allowed MIME types: image/*

-- Storage RLS policies (apply via dashboard if bucket is created there)
-- INSERT: Users can upload to their own folder
-- CREATE POLICY "watch_photos_storage_insert" ON storage.objects
--   FOR INSERT TO authenticated
--   WITH CHECK (
--     bucket_id = 'watch-photos'
--     AND (storage.foldername(name))[1] = auth.uid()::text
--   );

-- SELECT: Users can view their own photos
-- CREATE POLICY "watch_photos_storage_select" ON storage.objects
--   FOR SELECT TO authenticated
--   USING (
--     bucket_id = 'watch-photos'
--     AND (storage.foldername(name))[1] = auth.uid()::text
--   );

-- DELETE: Users can delete their own photos
-- CREATE POLICY "watch_photos_storage_delete" ON storage.objects
--   FOR DELETE TO authenticated
--   USING (
--     bucket_id = 'watch-photos'
--     AND (storage.foldername(name))[1] = auth.uid()::text
--   );

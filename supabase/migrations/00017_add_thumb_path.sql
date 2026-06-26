-- 00017_add_thumb_path.sql
-- Store a small thumbnail alongside each watch photo. The Collection views use
-- the thumbnail (tiny) instead of the ~2MB original so they load fast.
-- Nullable: rows without a thumbnail fall back to the full image.

ALTER TABLE public.watch_photos
  ADD COLUMN IF NOT EXISTS thumb_path TEXT;

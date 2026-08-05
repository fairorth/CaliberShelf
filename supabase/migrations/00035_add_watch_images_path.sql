-- 00035_add_watch_images_path.sql
-- Parent folder on the user's machine where per-watch image folders live.
-- Read by the local scripts/sync-watch-folders.mjs utility (the web app cannot
-- touch the local filesystem; this is configuration for that tool).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS watch_images_path TEXT;

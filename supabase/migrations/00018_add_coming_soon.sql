-- 00018_add_coming_soon.sql
-- Track watches that have been ordered but haven't arrived yet ("coming soon").

ALTER TABLE public.watches
  ADD COLUMN IF NOT EXISTS is_coming_soon BOOLEAN NOT NULL DEFAULT false;

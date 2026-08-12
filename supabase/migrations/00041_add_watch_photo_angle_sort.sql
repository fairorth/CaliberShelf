-- 00041_add_watch_photo_angle_sort.sql
-- Photo Lab (v2 Phase 3, findings D1/D2): per-photo angle tag — the five
-- angle classes from docs/photo-lab.md — and an explicit sort order for
-- filmstrip drag-reorder. Both nullable/backfill-free: angle is tagged from
-- the lightbox and during Review; sort_order falls back to display_order.

ALTER TABLE public.watch_photos
  ADD COLUMN IF NOT EXISTS angle TEXT
    CHECK (angle IS NULL OR angle IN ('flat', 'hero', 'profile', 'caseback', 'macro'));

ALTER TABLE public.watch_photos
  ADD COLUMN IF NOT EXISTS sort_order INTEGER;

-- The coverage matrix groups photos by (watch, angle).
CREATE INDEX IF NOT EXISTS idx_watch_photos_watch_angle
  ON public.watch_photos (watch_id, angle);

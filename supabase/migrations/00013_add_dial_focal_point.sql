-- 00013_add_dial_focal_point.sql
-- Add dial framing fields used by the home page WatchDial markers.
--
-- focal_x / focal_y are percentages (0–100) describing where the dial center
-- sits within the cover photo. They map directly to CSS `object-position`.
-- focal_zoom is a multiplier (1.0–4.0) applied as a CSS transform so the dial
-- can be cropped tighter than `object-cover` alone allows.
--
-- Defaults (50, 50, 1.0) preserve current behavior for every existing watch.

ALTER TABLE public.watches
  ADD COLUMN IF NOT EXISTS dial_focal_x NUMERIC(5,2) NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS dial_focal_y NUMERIC(5,2) NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS dial_zoom NUMERIC(4,2) NOT NULL DEFAULT 1.0;

ALTER TABLE public.watches
  DROP CONSTRAINT IF EXISTS dial_focal_x_range,
  DROP CONSTRAINT IF EXISTS dial_focal_y_range,
  DROP CONSTRAINT IF EXISTS dial_zoom_range;

ALTER TABLE public.watches
  ADD CONSTRAINT dial_focal_x_range CHECK (dial_focal_x BETWEEN 0 AND 100),
  ADD CONSTRAINT dial_focal_y_range CHECK (dial_focal_y BETWEEN 0 AND 100),
  ADD CONSTRAINT dial_zoom_range   CHECK (dial_zoom   BETWEEN 1.0 AND 4.0);

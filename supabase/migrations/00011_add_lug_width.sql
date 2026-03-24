-- 00011_add_lug_width.sql
-- Add lug width (mm) to watches for tracking compatible strap/bracelet sizes.

ALTER TABLE public.watches
  ADD COLUMN lug_width_mm NUMERIC(4,1);

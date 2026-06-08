-- 00014_add_lift_angle.sql
-- Add lift_angle to movements, alongside the existing free-text
-- beat_rate / power_reserve fields. Stored as TEXT so users can
-- enter "52", "52°", or "51.5°" — the UI is informational only.

ALTER TABLE public.movements
  ADD COLUMN IF NOT EXISTS lift_angle TEXT;

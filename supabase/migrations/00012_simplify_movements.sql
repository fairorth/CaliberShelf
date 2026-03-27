-- 00012_simplify_movements.sql
-- Dramatically simplify the movements table:
-- - Reduce to 5 fields: caliber_name, manufacturer, caliber_type, beat_rate, power_reserve
-- - Remove all pre-seeded system calibers
-- - Remove system movement concept (user_id no longer nullable)
-- - Remove condition from watches
-- - Clean up unused enums

-- ── Clear all existing movements ─────────────────────────────────
-- This also NULLs out movement_id on any watches that reference them
-- (FK is ON DELETE SET NULL)
DELETE FROM public.movements;

-- ── Drop columns we no longer need ───────────────────────────────
ALTER TABLE public.movements
  DROP COLUMN IF EXISTS base_caliber,
  DROP COLUMN IF EXISTS aliases,
  DROP COLUMN IF EXISTS display_type,
  DROP COLUMN IF EXISTS diameter_mm,
  DROP COLUMN IF EXISTS height_mm,
  DROP COLUMN IF EXISTS jewel_count,
  DROP COLUMN IF EXISTS accuracy_range,
  DROP COLUMN IF EXISTS hacking,
  DROP COLUMN IF EXISTS hand_windable,
  DROP COLUMN IF EXISTS quickset_date,
  DROP COLUMN IF EXISTS complications,
  DROP COLUMN IF EXISTS country_of_origin,
  DROP COLUMN IF EXISTS production_year_start,
  DROP COLUMN IF EXISTS production_year_end,
  DROP COLUMN IF EXISTS movement_type,
  DROP COLUMN IF EXISTS beat_rate_vph,
  DROP COLUMN IF EXISTS power_reserve_hours;

-- ── Add new simplified columns ───────────────────────────────────
ALTER TABLE public.movements ADD COLUMN IF NOT EXISTS caliber_type TEXT;
ALTER TABLE public.movements ADD COLUMN IF NOT EXISTS beat_rate TEXT;
ALTER TABLE public.movements ADD COLUMN IF NOT EXISTS power_reserve TEXT;

-- ── Make user_id NOT NULL (no more system movements) ─────────────
ALTER TABLE public.movements ALTER COLUMN user_id SET NOT NULL;

-- ── Add unique constraint per user on caliber_name ───────────────
ALTER TABLE public.movements
  ADD CONSTRAINT movements_user_caliber_unique UNIQUE (user_id, caliber_name);

-- ── Update RLS policies ──────────────────────────────────────────
DROP POLICY IF EXISTS "movements_select_all" ON public.movements;
DROP POLICY IF EXISTS "movements_select_anon" ON public.movements;
DROP POLICY IF EXISTS "movements_insert_owner" ON public.movements;
DROP POLICY IF EXISTS "movements_update_owner" ON public.movements;
DROP POLICY IF EXISTS "movements_delete_owner" ON public.movements;

CREATE POLICY "movements_select_owner" ON public.movements
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "movements_insert_owner" ON public.movements
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "movements_update_owner" ON public.movements
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "movements_delete_owner" ON public.movements
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ── Drop condition from watches ──────────────────────────────────
ALTER TABLE public.watches DROP COLUMN IF EXISTS condition;

-- ── Clean up unused enums ────────────────────────────────────────
DROP TYPE IF EXISTS public.display_type;
DROP TYPE IF EXISTS public.movement_type;

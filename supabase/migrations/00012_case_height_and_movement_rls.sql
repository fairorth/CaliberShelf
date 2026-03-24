-- 00012_case_height_and_movement_rls.sql
-- 1) Add case height to watches (thickness/height of the case)
-- 2) Relax movement RLS so authenticated users can edit/delete system movements

-- ── Case Height ──────────────────────────────────────────────────
ALTER TABLE public.watches
  ADD COLUMN IF NOT EXISTS case_height_mm NUMERIC(4,1);

-- ── Movement RLS ─────────────────────────────────────────────────
-- Drop the restrictive owner-only policies
DROP POLICY IF EXISTS "movements_update_owner" ON public.movements;
DROP POLICY IF EXISTS "movements_delete_owner" ON public.movements;

-- Authenticated users can update ANY visible movement (system or own)
CREATE POLICY "movements_update_authenticated" ON public.movements
  FOR UPDATE TO authenticated
  USING (user_id IS NULL OR auth.uid() = user_id)
  WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

-- Authenticated users can delete ANY visible movement (system or own)
CREATE POLICY "movements_delete_authenticated" ON public.movements
  FOR DELETE TO authenticated
  USING (user_id IS NULL OR auth.uid() = user_id);

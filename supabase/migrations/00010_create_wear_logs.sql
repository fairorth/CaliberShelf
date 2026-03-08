-- 00010_create_wear_logs.sql
-- Wear logging system: track which watches you wear and when.
-- Multiple watches per day allowed (no unique constraint on user_id+worn_date).

-- ── Table ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.wear_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  watch_id UUID NOT NULL REFERENCES public.watches(id) ON DELETE CASCADE,
  worn_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Indexes ──────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS wear_logs_user_id_idx ON public.wear_logs(user_id);
CREATE INDEX IF NOT EXISTS wear_logs_watch_id_idx ON public.wear_logs(watch_id);
CREATE INDEX IF NOT EXISTS wear_logs_user_worn_date_idx ON public.wear_logs(user_id, worn_date);

-- ── Updated-at trigger (reuse existing function) ──────────────────
CREATE TRIGGER wear_logs_updated_at
  BEFORE UPDATE ON public.wear_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ── RLS ──────────────────────────────────────────────────────────
ALTER TABLE public.wear_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wear_logs_select_owner" ON public.wear_logs
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "wear_logs_insert_owner" ON public.wear_logs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "wear_logs_update_owner" ON public.wear_logs
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "wear_logs_delete_owner" ON public.wear_logs
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

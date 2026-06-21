-- 00016_create_timegrapher_runs.sql
-- Timegrapher readings: track a watch's rate/amplitude/beat error over time.
-- A watch can have many runs; the change across runs is what matters, so no
-- unique constraint — every measurement is kept.

-- ── Table ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.timegrapher_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  watch_id UUID NOT NULL REFERENCES public.watches(id) ON DELETE CASCADE,
  run_date DATE NOT NULL DEFAULT CURRENT_DATE,
  rate_sec_per_day NUMERIC(5,1),    -- seconds/day, may be negative (e.g. -3.0)
  amplitude_deg NUMERIC(4,1),       -- degrees, typically 200–320
  beat_error_ms NUMERIC(3,1),       -- milliseconds, typically 0.0–9.9
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Indexes ──────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS timegrapher_runs_user_id_idx ON public.timegrapher_runs(user_id);
CREATE INDEX IF NOT EXISTS timegrapher_runs_watch_id_idx ON public.timegrapher_runs(watch_id);
CREATE INDEX IF NOT EXISTS timegrapher_runs_watch_run_date_idx ON public.timegrapher_runs(watch_id, run_date);

-- ── Updated-at trigger (reuse existing function) ──────────────────
CREATE TRIGGER timegrapher_runs_updated_at
  BEFORE UPDATE ON public.timegrapher_runs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ── RLS ──────────────────────────────────────────────────────────
ALTER TABLE public.timegrapher_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "timegrapher_runs_select_owner" ON public.timegrapher_runs
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "timegrapher_runs_insert_owner" ON public.timegrapher_runs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "timegrapher_runs_update_owner" ON public.timegrapher_runs
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "timegrapher_runs_delete_owner" ON public.timegrapher_runs
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

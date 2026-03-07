-- Per-user brand table for managed brand selection
CREATE TABLE IF NOT EXISTS public.brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  country_of_origin TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Each user's brands are unique by name
  UNIQUE(user_id, name)
);

CREATE INDEX IF NOT EXISTS brands_user_id_idx ON public.brands(user_id);

-- Enable RLS
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

-- Owner-only CRUD
CREATE POLICY "brands_select_owner" ON public.brands
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "brands_insert_owner" ON public.brands
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "brands_update_owner" ON public.brands
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "brands_delete_owner" ON public.brands
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Auto-update updated_at (reuses existing trigger function)
CREATE TRIGGER brands_updated_at
  BEFORE UPDATE ON public.brands
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

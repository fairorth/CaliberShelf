-- Fixed display case sizes
CREATE TYPE public.case_size AS ENUM ('3', '8', '24', '40');

-- Display cases that hold watches
CREATE TABLE IF NOT EXISTS public.display_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  capacity public.case_size NOT NULL,
  case_type TEXT,           -- optional label like "Quartz Watches", "Vintage Pieces"
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS display_cases_user_id_idx ON public.display_cases(user_id);

-- Enable RLS
ALTER TABLE public.display_cases ENABLE ROW LEVEL SECURITY;

-- Owner-only CRUD
CREATE POLICY "display_cases_select_owner" ON public.display_cases
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "display_cases_insert_owner" ON public.display_cases
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "display_cases_update_owner" ON public.display_cases
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "display_cases_delete_owner" ON public.display_cases
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Future: anyone can view public display cases
CREATE POLICY "display_cases_select_public" ON public.display_cases
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = display_cases.user_id
      AND profiles.is_public = true
    )
  );

CREATE TRIGGER display_cases_updated_at
  BEFORE UPDATE ON public.display_cases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

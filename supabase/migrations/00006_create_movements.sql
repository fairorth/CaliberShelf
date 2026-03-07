-- Display type for movements
CREATE TYPE public.display_type AS ENUM ('analog', 'digital', 'ana_digi');

-- Rich movement / caliber table
-- user_id IS NULL = system/seed movement (shared, read-only to users)
-- user_id NOT NULL = user-created custom movement
CREATE TABLE IF NOT EXISTS public.movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Identity
  caliber_name TEXT NOT NULL,
  manufacturer TEXT,
  base_caliber TEXT,
  aliases TEXT,

  -- Classification
  movement_type public.movement_type NOT NULL,
  display_type public.display_type NOT NULL DEFAULT 'analog',

  -- Dimensions
  diameter_mm NUMERIC(5,2),
  height_mm NUMERIC(5,2),

  -- Performance
  jewel_count INTEGER,
  beat_rate_vph INTEGER,
  power_reserve_hours INTEGER,
  accuracy_range TEXT,

  -- Features
  hacking BOOLEAN NOT NULL DEFAULT false,
  hand_windable BOOLEAN NOT NULL DEFAULT false,
  quickset_date BOOLEAN NOT NULL DEFAULT false,

  -- Complications & meta
  complications TEXT,
  country_of_origin TEXT,
  production_year_start INTEGER,
  production_year_end INTEGER,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS movements_user_id_idx ON public.movements(user_id);
CREATE INDEX IF NOT EXISTS movements_caliber_name_idx ON public.movements(caliber_name);

-- Enable RLS
ALTER TABLE public.movements ENABLE ROW LEVEL SECURITY;

-- Everyone can read system movements (user_id IS NULL) + own movements
CREATE POLICY "movements_select_all" ON public.movements
  FOR SELECT TO authenticated
  USING (user_id IS NULL OR auth.uid() = user_id);

-- Users can only insert their own movements (user_id must be set)
CREATE POLICY "movements_insert_owner" ON public.movements
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);

-- Users can only update their own movements (not system ones)
CREATE POLICY "movements_update_owner" ON public.movements
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND user_id IS NOT NULL)
  WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);

-- Users can only delete their own movements
CREATE POLICY "movements_delete_owner" ON public.movements
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id AND user_id IS NOT NULL);

-- Public profile viewers can see system movements
CREATE POLICY "movements_select_anon" ON public.movements
  FOR SELECT TO anon
  USING (user_id IS NULL);

CREATE TRIGGER movements_updated_at
  BEFORE UPDATE ON public.movements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

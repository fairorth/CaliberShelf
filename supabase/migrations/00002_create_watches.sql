-- Create enums for watch attributes
CREATE TYPE public.movement_type AS ENUM (
  'automatic',
  'manual_wind',
  'quartz',
  'solar',
  'spring_drive',
  'smartwatch',
  'other'
);

CREATE TYPE public.case_material AS ENUM (
  'stainless_steel',
  'titanium',
  'gold',
  'rose_gold',
  'white_gold',
  'platinum',
  'ceramic',
  'carbon',
  'bronze',
  'other'
);

CREATE TYPE public.crystal_type AS ENUM (
  'sapphire',
  'mineral',
  'acrylic',
  'hesalite',
  'other'
);

CREATE TYPE public.watch_condition AS ENUM (
  'new',
  'like_new',
  'excellent',
  'very_good',
  'good',
  'fair',
  'poor'
);

-- Create watches table
CREATE TABLE IF NOT EXISTS public.watches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Core identity
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  reference_number TEXT,
  serial_number TEXT,
  nickname TEXT,

  -- Specs
  movement public.movement_type,
  case_material public.case_material,
  case_diameter_mm NUMERIC(5, 1),
  crystal public.crystal_type,
  water_resistance_m INTEGER,
  dial_color TEXT,
  complication TEXT,

  -- Ownership
  condition public.watch_condition,
  purchase_date DATE,
  purchase_price_cents BIGINT,
  purchase_currency TEXT NOT NULL DEFAULT 'USD',
  notes TEXT,

  -- Sharing (ready for future feature)
  is_public BOOLEAN NOT NULL DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for user lookups (most common query pattern)
CREATE INDEX IF NOT EXISTS watches_user_id_idx ON public.watches(user_id);

-- Enable RLS
ALTER TABLE public.watches ENABLE ROW LEVEL SECURITY;

-- Owner can view their own watches
CREATE POLICY "watches_select_owner" ON public.watches
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Owner can insert watches for themselves
CREATE POLICY "watches_insert_owner" ON public.watches
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Owner can update their own watches
CREATE POLICY "watches_update_owner" ON public.watches
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Owner can delete their own watches
CREATE POLICY "watches_delete_owner" ON public.watches
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Future: anyone can view public watches
CREATE POLICY "watches_select_public" ON public.watches
  FOR SELECT TO anon, authenticated
  USING (is_public = true);

-- Auto-update updated_at (reuse trigger function from profiles migration)
CREATE TRIGGER watches_updated_at
  BEFORE UPDATE ON public.watches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

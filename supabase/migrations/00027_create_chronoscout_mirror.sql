-- 00027_create_chronoscout_mirror.sql
-- Local mirror of the ChronoScout public catalog API (v1.0):
--   https://chronoscout.co/public-api/v1.0/reference/
--
-- The public API is a read-only SPEC CATALOG (brands + watch models with
-- dimensions) — it has NO pricing, availability, reference numbers, or alerts.
-- scripts/chronoscout-sync.mjs pulls it on a schedule and upserts into the
-- tables below; the app reads from these tables (never the API at runtime).
--
-- These are GLOBAL reference tables, not per-user data: there is no user_id.
-- Any authenticated user may read; writes happen only via the service role
-- (which bypasses RLS) from the sync script. This mirrors the original shared
-- "system" pattern once used by movements (00006).
--
-- Licensing (meta.license = api-terms-of-access v1.0): data may be cached/
-- stored while access is active but must be purge-able on revocation. A mirror
-- makes that a single TRUNCATE. Keep read access to authenticated only (no
-- anon) so the data is surfaced solely within the app to its end users.

-- Trigram index support for fast typeahead on names.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ── Brands catalog ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.chronoscout_brands (
  id UUID PRIMARY KEY,                 -- ChronoScout brand id
  short_id TEXT,
  name TEXT NOT NULL,
  slug TEXT,
  domain TEXT,                         -- brand website host; store_url candidate
  chronoscout_url TEXT,                -- canonical (en) brand page
  logo_src TEXT,

  -- specs.* broken out for querying; full specs kept in `specs` JSONB
  case_sizes_mm NUMERIC[],
  movement_names TEXT[],
  movement_types TEXT[],
  styles TEXT[],
  price_min_cents BIGINT,              -- specs.price_range_usd[0] * 100
  price_max_cents BIGINT,              -- specs.price_range_usd[1] * 100
  specs JSONB,

  most_recent_watch_added_at TIMESTAMPTZ,
  source_created_at TIMESTAMPTZ,       -- brand.created_at (source)
  source_modified_at TIMESTAMPTZ,      -- brand.modified_at — drives incremental sync
  raw JSONB,                           -- full source record

  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),  -- last sync that saw this row
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chronoscout_brands_name_trgm_idx
  ON public.chronoscout_brands USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS chronoscout_brands_slug_idx
  ON public.chronoscout_brands (slug);
CREATE INDEX IF NOT EXISTS chronoscout_brands_domain_idx
  ON public.chronoscout_brands (domain);

-- ── Watches catalog ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.chronoscout_watches (
  id UUID PRIMARY KEY,                 -- ChronoScout model id
  name TEXT NOT NULL,                  -- brand + model (often incl. a ref token)
  brand_id UUID,                       -- ChronoScout brand id (soft link, not FK:
                                       -- avoids brand/watch sync-order coupling)
  brand_name TEXT,                     -- denormalized for display/matching
  chronoscout_url TEXT,                -- canonical (en) model page
  image_src TEXT,

  -- data.* dimensions (all optional; source omits some)
  diameter_mm NUMERIC(6,2),
  between_lugs_mm NUMERIC(6,2),        -- data.betweenLugsMm (lug/strap width)
  lug_to_lug_mm NUMERIC(6,2),          -- data.lugToLugMm (case length)
  thickness_mm NUMERIC(6,2),           -- data.thicknessMm (case height)
  weight_g NUMERIC(7,2),

  type TEXT,                           -- data source `type` (sparse/variant text)
  raw JSONB,

  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chronoscout_watches_name_trgm_idx
  ON public.chronoscout_watches USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS chronoscout_watches_brand_id_idx
  ON public.chronoscout_watches (brand_id);

-- ── Sync bookkeeping (single row, id = 1) ────────────────────────
CREATE TABLE IF NOT EXISTS public.chronoscout_sync_state (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  last_brands_sync_at TIMESTAMPTZ,     -- server generated_at of last brands run
  last_watches_sync_at TIMESTAMPTZ,    -- server generated_at of last watches run
                                       -- (passed as modified_since next run)
  brands_count INTEGER,
  watches_count INTEGER,
  license JSONB,                       -- most recent meta.license block seen
  last_run_notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── RLS: authenticated read-only; service role writes (bypasses RLS) ──
ALTER TABLE public.chronoscout_brands     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chronoscout_watches    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chronoscout_sync_state ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'chronoscout_brands_select_auth') THEN
    CREATE POLICY chronoscout_brands_select_auth ON public.chronoscout_brands
      FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'chronoscout_watches_select_auth') THEN
    CREATE POLICY chronoscout_watches_select_auth ON public.chronoscout_watches
      FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'chronoscout_sync_state_select_auth') THEN
    CREATE POLICY chronoscout_sync_state_select_auth ON public.chronoscout_sync_state
      FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

-- ── updated_at triggers (reuse existing function) ────────────────
DROP TRIGGER IF EXISTS chronoscout_brands_updated_at ON public.chronoscout_brands;
CREATE TRIGGER chronoscout_brands_updated_at
  BEFORE UPDATE ON public.chronoscout_brands
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS chronoscout_watches_updated_at ON public.chronoscout_watches;
CREATE TRIGGER chronoscout_watches_updated_at
  BEFORE UPDATE ON public.chronoscout_watches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS chronoscout_sync_state_updated_at ON public.chronoscout_sync_state;
CREATE TRIGGER chronoscout_sync_state_updated_at
  BEFORE UPDATE ON public.chronoscout_sync_state
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

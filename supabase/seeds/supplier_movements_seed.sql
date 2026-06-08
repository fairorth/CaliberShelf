-- ======================================================================
-- CaliberShelf — Supplier / Ebauche Movements Seed (v2)
-- ======================================================================
--
-- Companion to movements_seed.sql. This file focuses specifically on
-- "supplier" movements — the off-the-shelf calibers sold to multiple
-- watchmakers (micro-brands, mid-range Swiss, Japanese, Chinese).
-- These are the workhorses you'll find inside dozens of unrelated brands.
--
-- Brand-specific in-house calibers (Rolex 3135, Omega 8500, Tudor MT5xxx,
-- etc.) are in the first seed file — not duplicated here.
--
-- HOW TO USE
-- ----------
-- 1. Find your user_id:
--      SELECT id, email FROM auth.users WHERE email = 'fairorth@gmail.com';
-- 2. Paste the UUID below where it says PASTE-YOUR-USER-ID-HERE.
-- 3. Paste this entire file into the Supabase SQL Editor and run.
-- 4. Safe to re-run; ON CONFLICT preserves any existing entries.
--
-- DATA SOURCES
-- ------------
-- WatchGuy lift-angle DB, Caliber Corner, manufacturer technical sheets
-- (ETA, Sellita, Miyota, Seiko TMI, HKPT, Sea-Gull, Soprod, La Joux-Perret),
-- Grail Watch Reference, Geckota / Borealis / WatchGecko movement guides.
--
-- ======================================================================

DO $$
DECLARE
  v_user_id UUID := 'PASTE-YOUR-USER-ID-HERE';
BEGIN
  IF v_user_id::TEXT = 'PASTE-YOUR-USER-ID-HERE' THEN
    RAISE EXCEPTION 'Replace v_user_id with your actual auth.users.id UUID before running.';
  END IF;

  INSERT INTO public.movements
    (user_id, caliber_name, manufacturer, caliber_type, beat_rate, power_reserve, lift_angle)
  VALUES
  -- ── ETA — additional variants ────────────────────────────────────
  (v_user_id, 'ETA 2804-2',  'ETA', 'mechanical_manual',    '28,800 vph', '42h', '50'), -- manual 2824
  (v_user_id, 'ETA 2891',    'ETA', 'mechanical_automatic', '28,800 vph', '42h', '52'),
  (v_user_id, 'ETA 2893-2',  'ETA', 'mechanical_automatic', '28,800 vph', '42h', '52'), -- GMT
  (v_user_id, 'ETA 2894-2',  'ETA', 'mechanical_automatic', '28,800 vph', '42h', '52'), -- chrono module
  (v_user_id, 'ETA 7765',    'ETA', 'mechanical_manual',    '21,600 vph', '46h', NULL), -- manual chrono
  (v_user_id, 'ETA 2658',    'ETA', 'mechanical_automatic', '21,600 vph', '40h', NULL), -- ladies
  (v_user_id, 'ETA 251.262', 'ETA', 'quartz',               NULL,         NULL,  NULL), -- chrono quartz
  (v_user_id, 'ETA 251.272', 'ETA', 'quartz',               NULL,         NULL,  NULL),
  (v_user_id, 'ETA E03.001', 'ETA', 'quartz',               NULL,         NULL,  NULL),
  (v_user_id, 'ETA G10.211', 'ETA', 'quartz',               NULL,         NULL,  NULL), -- chrono quartz

  -- ── Sellita — additional variants ────────────────────────────────
  (v_user_id, 'Sellita SW100',   'Sellita', 'mechanical_automatic', '28,800 vph', '42h', NULL), -- ladies / small
  (v_user_id, 'Sellita SW215-1', 'Sellita', 'mechanical_manual',    '28,800 vph', '42h', NULL),
  (v_user_id, 'Sellita SW216-1', 'Sellita', 'mechanical_manual',    '28,800 vph', '42h', NULL),
  (v_user_id, 'Sellita SW221-1', 'Sellita', 'mechanical_automatic', '28,800 vph', '41h', NULL), -- date + small seconds at 6
  (v_user_id, 'Sellita SW261-1', 'Sellita', 'mechanical_automatic', '28,800 vph', '41h', NULL),
  (v_user_id, 'Sellita SW270-1', 'Sellita', 'mechanical_automatic', '28,800 vph', '38h', NULL), -- no date
  (v_user_id, 'Sellita SW280-1', 'Sellita', 'mechanical_automatic', '28,800 vph', '41h', NULL), -- small seconds at 9
  (v_user_id, 'Sellita SW290-1', 'Sellita', 'mechanical_automatic', '28,800 vph', '41h', NULL),
  (v_user_id, 'Sellita SW400',   'Sellita', 'mechanical_automatic', '28,800 vph', '38h', NULL), -- 31mm large version
  (v_user_id, 'Sellita SW410',   'Sellita', 'mechanical_automatic', '28,800 vph', '38h', NULL),
  (v_user_id, 'Sellita SW610',   'Sellita', 'mechanical_manual',    '21,600 vph', '50h', NULL), -- 6498 clone
  (v_user_id, 'Sellita SW1000',  'Sellita', 'mechanical_automatic', '28,800 vph', '38h', NULL), -- ultra thin

  -- ── Miyota — additional variants ─────────────────────────────────
  (v_user_id, 'Miyota 8N24',  'Miyota', 'mechanical_automatic', '21,600 vph', '42h', NULL), -- skeleton
  (v_user_id, 'Miyota 8N33',  'Miyota', 'mechanical_manual',    '21,600 vph', '42h', NULL), -- skeleton manual
  (v_user_id, 'Miyota 6T15',  'Miyota', 'mechanical_automatic', '21,600 vph', '40h', NULL), -- ladies
  (v_user_id, 'Miyota 6T33',  'Miyota', 'mechanical_automatic', '28,800 vph', '42h', NULL), -- ladies skeleton
  (v_user_id, 'Miyota 6L02',  'Miyota', 'mechanical_manual',    '28,800 vph', '50h', NULL),
  (v_user_id, 'Miyota 6P29',  'Miyota', 'mechanical_automatic', '28,800 vph', '42h', NULL),
  (v_user_id, 'Miyota 9075',  'Miyota', 'mechanical_automatic', '28,800 vph', '42h', NULL), -- GMT
  (v_user_id, 'Miyota 9132',  'Miyota', 'mechanical_automatic', '28,800 vph', '42h', NULL), -- moon phase
  (v_user_id, 'Miyota 1L40',  'Miyota', 'quartz',               NULL,         NULL,  NULL),
  (v_user_id, 'Miyota 1L45',  'Miyota', 'quartz',               NULL,         NULL,  NULL),
  (v_user_id, 'Miyota 2025',  'Miyota', 'quartz',               NULL,         NULL,  NULL),
  (v_user_id, 'Miyota 2305',  'Miyota', 'quartz',               NULL,         NULL,  NULL),
  (v_user_id, 'Miyota 7T84',  'Miyota', 'quartz',               NULL,         NULL,  NULL), -- chrono quartz
  (v_user_id, 'Miyota 0S60',  'Miyota', 'quartz',               NULL,         NULL,  NULL), -- chrono quartz
  (v_user_id, 'Miyota 0S80',  'Miyota', 'quartz',               NULL,         NULL,  NULL),

  -- ── Soprod (Swiss supplier) ──────────────────────────────────────
  (v_user_id, 'Soprod A10-2',  'Soprod', 'mechanical_automatic', '28,800 vph', '42h', NULL),
  (v_user_id, 'Soprod A10-S',  'Soprod', 'mechanical_automatic', '28,800 vph', '42h', NULL),
  (v_user_id, 'Soprod A10P',   'Soprod', 'mechanical_automatic', '28,800 vph', '42h', NULL),
  (v_user_id, 'Soprod C125',   'Soprod', 'mechanical_automatic', '28,800 vph', '42h', NULL),
  (v_user_id, 'Soprod Newton', 'Soprod', 'mechanical_automatic', '28,800 vph', '44h', NULL), -- 2024+
  (v_user_id, 'Soprod 9094',   'Soprod', 'mechanical_automatic', '21,600 vph', '40h', NULL), -- small caliber
  (v_user_id, 'Soprod M100-2', 'Soprod', 'mechanical_automatic', '28,800 vph', '42h', NULL),
  (v_user_id, 'Soprod TT651',  'Soprod', 'mechanical_automatic', '28,800 vph', '42h', NULL), -- GMT

  -- ── Seiko TMI / SII (supplied to micro-brands) ──────────────────
  (v_user_id, 'NE15A',  'Seiko TMI', 'mechanical_automatic', '21,600 vph', '50h', '53'), -- = 6R15
  (v_user_id, 'NE20A',  'Seiko TMI', 'mechanical_automatic', '28,800 vph', '45h', NULL),
  (v_user_id, 'NE57A',  'Seiko TMI', 'mechanical_automatic', '21,600 vph', '50h', NULL), -- power-reserve dial
  (v_user_id, 'NE76A',  'Seiko TMI', 'mechanical_automatic', '28,800 vph', '45h', NULL), -- chrono
  (v_user_id, 'NE86A',  'Seiko TMI', 'mechanical_automatic', '28,800 vph', '45h', NULL),
  (v_user_id, 'NE88A',  'Seiko TMI', 'mechanical_automatic', '28,800 vph', '45h', NULL), -- premium tri-compax chrono
  (v_user_id, 'NH26A',  'Seiko TMI', 'mechanical_automatic', '21,600 vph', '41h', '53'),
  (v_user_id, 'NH28A',  'Seiko TMI', 'mechanical_automatic', '21,600 vph', '41h', '53'),
  (v_user_id, 'NH29A',  'Seiko TMI', 'mechanical_automatic', '21,600 vph', '41h', NULL), -- newer GMT-style
  (v_user_id, 'NH34A',  'Seiko TMI', 'mechanical_automatic', '21,600 vph', '41h', NULL), -- true GMT
  (v_user_id, 'NH37A',  'Seiko TMI', 'mechanical_automatic', '21,600 vph', '41h', NULL), -- skeleton
  (v_user_id, '4R57',   'Seiko',     'mechanical_automatic', '21,600 vph', '50h', NULL),
  (v_user_id, '4R71',   'Seiko',     'mechanical_automatic', '21,600 vph', '45h', NULL),
  (v_user_id, '4R72',   'Seiko',     'mechanical_automatic', '21,600 vph', '45h', NULL),
  (v_user_id, '7N42',   'Seiko',     'quartz',               NULL,         NULL,  NULL),
  (v_user_id, '7N43',   'Seiko',     'quartz',               NULL,         NULL,  NULL),
  (v_user_id, 'VD53',   'Seiko TMI', 'quartz',               NULL,         NULL,  NULL), -- chrono quartz
  (v_user_id, 'VD54',   'Seiko TMI', 'quartz',               NULL,         NULL,  NULL),
  (v_user_id, 'VK63',   'Seiko TMI', 'quartz',               NULL,         NULL,  NULL), -- mecaquartz chrono
  (v_user_id, 'VK64',   'Seiko TMI', 'quartz',               NULL,         NULL,  NULL),
  (v_user_id, 'VK67',   'Seiko TMI', 'quartz',               NULL,         NULL,  NULL),
  (v_user_id, 'VK68',   'Seiko TMI', 'quartz',               NULL,         NULL,  NULL),

  -- ── Chinese suppliers ────────────────────────────────────────────
  -- HKPT (Hong Kong Precision Technology) — popular Sellita/ETA clones
  (v_user_id, 'PT5000',         'HKPT',     'mechanical_automatic', '28,800 vph', '38h', '50'), -- SW200/2824 clone
  (v_user_id, 'PT5100',         'HKPT',     'mechanical_manual',    '28,800 vph', '38h', '50'), -- ETA 2804 clone
  (v_user_id, 'PT5400',         'HKPT',     'mechanical_automatic', '28,800 vph', '38h', NULL), -- larger version

  -- Dixmont Guangzhou (DG) — broad budget supplier
  (v_user_id, 'Dixmont DG2813', 'Dixmont',  'mechanical_automatic', '21,600 vph', '40h', NULL), -- Miyota 8215 clone
  (v_user_id, 'Dixmont DG2824', 'Dixmont',  'mechanical_automatic', '28,800 vph', '40h', NULL),
  (v_user_id, 'Dixmont DG3804', 'Dixmont',  'mechanical_automatic', '21,600 vph', '40h', NULL), -- 4-hand GMT
  (v_user_id, 'Dixmont DG5833', 'Mingzhu',  'mechanical_automatic', '21,600 vph', '40h', NULL), -- GMT module

  -- Tianjin Sea-Gull (TY / ST families) — major Chinese supplier
  (v_user_id, 'TY2806 / ST1612', 'Sea-Gull', 'mechanical_automatic', '21,600 vph', '36h', NULL),
  (v_user_id, 'TY2807',          'Sea-Gull', 'mechanical_automatic', '21,600 vph', '40h', NULL),
  (v_user_id, 'TY2809',          'Sea-Gull', 'mechanical_automatic', '21,600 vph', '40h', NULL), -- 31mm skeleton
  (v_user_id, 'TY2706 / ST1701', 'Sea-Gull', 'mechanical_automatic', '28,800 vph', '40h', NULL),
  (v_user_id, 'TY2130 / ST2130', 'Sea-Gull', 'mechanical_automatic', '28,800 vph', '38h', NULL), -- ETA 2824 clone
  (v_user_id, 'TY3000',          'Sea-Gull', 'mechanical_automatic', '21,600 vph', '40h', NULL),
  (v_user_id, 'Sea-Gull ST2505', 'Sea-Gull', 'mechanical_automatic', '21,600 vph', '40h', NULL), -- small
  (v_user_id, 'Sea-Gull ST3600', 'Sea-Gull', 'mechanical_manual',    '18,000 vph', '40h', NULL),
  (v_user_id, 'Sea-Gull TY2807-2','Sea-Gull','mechanical_automatic', '21,600 vph', '40h', NULL),

  -- Beijing Watch Factory
  (v_user_id, 'Beijing BJ2638', 'Beijing',  'mechanical_automatic', '28,800 vph', '40h', NULL),
  (v_user_id, 'Beijing SB18',   'Beijing',  'mechanical_automatic', '28,800 vph', '42h', NULL),
  (v_user_id, 'Beijing SB19',   'Beijing',  'mechanical_automatic', '28,800 vph', '42h', NULL),

  -- Liaoning (LN)
  (v_user_id, 'Liaoning SL1588', 'Liaoning', 'mechanical_automatic', '21,600 vph', '40h', NULL),

  -- ── La Joux-Perret (Citizen-owned Swiss supplier) ────────────────
  -- Strong alternatives to ETA/Sellita 2892 / SW200
  (v_user_id, 'LJP-G100',   'La Joux-Perret', 'mechanical_automatic', '28,800 vph', '68h', NULL),
  (v_user_id, 'LJP-G101',   'La Joux-Perret', 'mechanical_automatic', '28,800 vph', '68h', NULL), -- date variant
  (v_user_id, 'LJP-L100',   'La Joux-Perret', 'mechanical_automatic', '28,800 vph', '68h', NULL), -- small seconds
  (v_user_id, 'LJP-D100',   'La Joux-Perret', 'mechanical_automatic', '28,800 vph', '68h', NULL), -- big date
  (v_user_id, 'LJP-7750',   'La Joux-Perret', 'mechanical_automatic', '28,800 vph', '48h', '49'), -- 7750 base chrono
  (v_user_id, 'LJP-8147',   'La Joux-Perret', 'mechanical_automatic', '28,800 vph', '60h', NULL),

  -- ── Vaucher (high-end supplier, Hermes / Parmigiani) ────────────
  (v_user_id, 'Vaucher VMF 5400', 'Vaucher', 'mechanical_automatic', '21,600 vph', '50h', NULL), -- micro-rotor
  (v_user_id, 'Vaucher VMF 5401', 'Vaucher', 'mechanical_automatic', '21,600 vph', '50h', NULL),
  (v_user_id, 'Vaucher VMF 6400', 'Vaucher', 'mechanical_automatic', '28,800 vph', '50h', NULL), -- chrono

  -- ── Concepto (Swiss supplier) ────────────────────────────────────
  (v_user_id, 'Concepto C-2000', 'Concepto', 'mechanical_automatic', '28,800 vph', '42h', NULL),
  (v_user_id, 'Concepto C-8950', 'Concepto', 'mechanical_automatic', '28,800 vph', '48h', NULL), -- chrono
  (v_user_id, 'Concepto C-3000', 'Concepto', 'mechanical_automatic', '28,800 vph', '42h', NULL),

  -- ── Ronda — mechanical and additional quartz ─────────────────────
  (v_user_id, 'Ronda R150',  'Ronda', 'mechanical_automatic', '28,800 vph', '40h', NULL),
  (v_user_id, 'Ronda R130',  'Ronda', 'mechanical_manual',    '28,800 vph', '40h', NULL),
  (v_user_id, 'Ronda 788',   'Ronda', 'mechanical_automatic', '28,800 vph', '40h', NULL),
  (v_user_id, 'Ronda 7004',  'Ronda', 'quartz',               NULL,         NULL,  NULL),
  (v_user_id, 'Ronda 8040',  'Ronda', 'quartz',               NULL,         NULL,  NULL), -- chrono
  (v_user_id, 'Ronda 3540.D','Ronda', 'quartz',               NULL,         NULL,  NULL),

  -- ── ISA (Swiss quartz supplier) ──────────────────────────────────
  (v_user_id, 'ISA 1198',  'ISA', 'quartz', NULL, NULL, NULL),
  (v_user_id, 'ISA 8172',  'ISA', 'quartz', NULL, NULL, NULL), -- chrono
  (v_user_id, 'ISA 8261',  'ISA', 'quartz', NULL, NULL, NULL),
  (v_user_id, 'ISA 9231',  'ISA', 'quartz', NULL, NULL, NULL)

  ON CONFLICT (user_id, caliber_name) DO NOTHING;

  RAISE NOTICE 'Supplier movement seed complete.';
END $$;

-- ======================================================================
-- CaliberShelf — Popular Movements Seed
-- ======================================================================
--
-- Loads ~200 popular commercial watch movements into your personal
-- movements table. Safe to re-run: existing calibers (matched by name)
-- are left untouched thanks to ON CONFLICT DO NOTHING.
--
-- HOW TO USE
-- ----------
-- 1. Find your user_id by running this in the Supabase SQL Editor:
--
--      SELECT id, email FROM auth.users WHERE email = 'fairorth@gmail.com';
--
-- 2. Paste the UUID in the v_user_id assignment below (line ~26).
-- 3. Paste the entire file (including the DO $$ block) into the SQL Editor
--    and run it. Should insert anywhere from 0 (if already run) to ~200
--    new rows.
--
-- DATA NOTES
-- ----------
-- * Specs are sourced from manufacturer documentation, Caliber Corner,
--   WatchGuy lift-angle database, and Ranfft DB. Where a value isn't well
--   established or varies across sources/versions, the field is left NULL.
-- * Lift angles are stored as plain numbers without a degree symbol so
--   sort behavior is consistent.
-- * Beat rates use the "vph" (vibrations per hour) convention — the same
--   format you'd already entered manually.
-- * Quartz movements: beat_rate / power_reserve / lift_angle are all NULL.
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
  -- ── Seiko / SII (Japan) ──────────────────────────────────────────
  (v_user_id, 'NH35',        'Seiko Instruments', 'mechanical_automatic', '21,600 vph', '41h',  '53'),
  (v_user_id, 'NH36',        'Seiko Instruments', 'mechanical_automatic', '21,600 vph', '41h',  '53'),
  (v_user_id, 'NH38',        'Seiko Instruments', 'mechanical_automatic', '21,600 vph', '41h',  '53'),
  (v_user_id, 'NH39',        'Seiko Instruments', 'mechanical_automatic', '21,600 vph', '41h',  '53'),
  (v_user_id, 'NH70',        'Seiko Instruments', 'mechanical_automatic', '21,600 vph', '41h',  '53'),
  (v_user_id, 'NH72',        'Seiko Instruments', 'mechanical_automatic', '21,600 vph', '41h',  '53'),
  (v_user_id, '4R35',        'Seiko',             'mechanical_automatic', '21,600 vph', '41h',  '53'),
  (v_user_id, '4R36',        'Seiko',             'mechanical_automatic', '21,600 vph', '41h',  '53'),
  (v_user_id, '4R37',        'Seiko',             'mechanical_automatic', '21,600 vph', '41h',  '53'),
  (v_user_id, '4R57',        'Seiko',             'mechanical_automatic', '21,600 vph', '41h',  NULL),
  (v_user_id, '6R15',        'Seiko',             'mechanical_automatic', '21,600 vph', '50h',  '53'),
  (v_user_id, '6R20',        'Seiko',             'mechanical_automatic', '28,800 vph', '45h',  NULL),
  (v_user_id, '6R31',        'Seiko',             'mechanical_automatic', '21,600 vph', '70h',  NULL),
  (v_user_id, '6R35',        'Seiko',             'mechanical_automatic', '21,600 vph', '70h',  NULL),
  (v_user_id, '6R55',        'Seiko',             'mechanical_automatic', '21,600 vph', '72h',  NULL),
  (v_user_id, '7S26',        'Seiko',             'mechanical_automatic', '21,600 vph', '41h',  '53'),
  (v_user_id, '7S36',        'Seiko',             'mechanical_automatic', '21,600 vph', '41h',  '53'),
  (v_user_id, '8L35',        'Seiko',             'mechanical_automatic', '28,800 vph', '50h',  '50'),
  (v_user_id, '8L39',        'Seiko',             'mechanical_automatic', '28,800 vph', '72h',  NULL),
  (v_user_id, '9R65',        'Seiko',             'mechanical_automatic', NULL,         '72h',  NULL), -- Spring Drive
  (v_user_id, '9R86',        'Seiko',             'mechanical_automatic', NULL,         '72h',  NULL), -- Spring Drive chrono
  (v_user_id, '9S65',        'Grand Seiko',       'mechanical_automatic', '28,800 vph', '72h',  '52'),
  (v_user_id, '9S85',        'Grand Seiko',       'mechanical_automatic', '36,000 vph', '55h',  NULL),
  (v_user_id, '9SA5',        'Grand Seiko',       'mechanical_automatic', '36,000 vph', '80h',  NULL),
  (v_user_id, '9F61',        'Seiko',             'quartz',               NULL,         NULL,   NULL),
  (v_user_id, '9F62',        'Seiko',             'quartz',               NULL,         NULL,   NULL),
  (v_user_id, '9F83',        'Seiko',             'quartz',               NULL,         NULL,   NULL),
  (v_user_id, '7T92',        'Seiko',             'quartz',               NULL,         NULL,   NULL),

  -- ── ETA (Swiss) ──────────────────────────────────────────────────
  (v_user_id, 'ETA 2824-2',  'ETA', 'mechanical_automatic', '28,800 vph', '38h', '50'),
  (v_user_id, 'ETA 2836-2',  'ETA', 'mechanical_automatic', '28,800 vph', '38h', '50'),
  (v_user_id, 'ETA 2892-A2', 'ETA', 'mechanical_automatic', '28,800 vph', '42h', '52'),
  (v_user_id, 'ETA 2895-2',  'ETA', 'mechanical_automatic', '28,800 vph', '42h', '52'),
  (v_user_id, 'ETA 2671',    'ETA', 'mechanical_automatic', '28,800 vph', '38h', NULL),
  (v_user_id, 'ETA 2660',    'ETA', 'mechanical_automatic', '28,800 vph', '42h', NULL),
  (v_user_id, 'ETA 2000-1',  'ETA', 'mechanical_automatic', '28,800 vph', '40h', NULL),
  (v_user_id, 'ETA 7750',    'ETA', 'mechanical_automatic', '28,800 vph', '44h', '49'),
  (v_user_id, 'ETA 7751',    'ETA', 'mechanical_automatic', '28,800 vph', '44h', '49'),
  (v_user_id, 'ETA 7753',    'ETA', 'mechanical_automatic', '28,800 vph', '44h', '49'),
  (v_user_id, 'ETA 7754',    'ETA', 'mechanical_automatic', '28,800 vph', '44h', '49'),
  (v_user_id, 'ETA 6497-1',  'ETA', 'mechanical_manual',    '18,000 vph', '46h', '44'),
  (v_user_id, 'ETA 6497-2',  'ETA', 'mechanical_manual',    '21,600 vph', '50h', '44'),
  (v_user_id, 'ETA 6498-1',  'ETA', 'mechanical_manual',    '18,000 vph', '46h', '44'),
  (v_user_id, 'ETA 6498-2',  'ETA', 'mechanical_manual',    '21,600 vph', '50h', '44'),
  (v_user_id, 'ETA 7001',    'ETA', 'mechanical_manual',    '21,600 vph', '42h', NULL), -- Peseux 7001
  (v_user_id, 'ETA C07.111', 'ETA', 'mechanical_automatic', '21,600 vph', '80h', '50'), -- Powermatic 80
  (v_user_id, 'ETA C07.611', 'ETA', 'mechanical_automatic', '21,600 vph', '80h', '50'),
  (v_user_id, 'ETA F06.111', 'ETA', 'quartz',               NULL,         NULL,  NULL),
  (v_user_id, 'ETA 955.112', 'ETA', 'quartz',               NULL,         NULL,  NULL),
  (v_user_id, 'ETA 955.412', 'ETA', 'quartz',               NULL,         NULL,  NULL),
  (v_user_id, 'ETA 256.461', 'ETA', 'quartz',               NULL,         NULL,  NULL),
  (v_user_id, 'ETA 980.153', 'ETA', 'quartz',               NULL,         NULL,  NULL),
  (v_user_id, 'ETA 251.471', 'ETA', 'quartz',               NULL,         NULL,  NULL), -- chrono quartz

  -- ── Sellita (Swiss) ──────────────────────────────────────────────
  (v_user_id, 'Sellita SW200-1', 'Sellita', 'mechanical_automatic', '28,800 vph', '38h', '50'),
  (v_user_id, 'Sellita SW210-1', 'Sellita', 'mechanical_manual',    '28,800 vph', '42h', NULL),
  (v_user_id, 'Sellita SW220-1', 'Sellita', 'mechanical_automatic', '28,800 vph', '38h', NULL),
  (v_user_id, 'Sellita SW240-1', 'Sellita', 'mechanical_automatic', '28,800 vph', '38h', NULL),
  (v_user_id, 'Sellita SW260-1', 'Sellita', 'mechanical_automatic', '28,800 vph', '38h', NULL),
  (v_user_id, 'Sellita SW290-1', 'Sellita', 'mechanical_automatic', '28,800 vph', '38h', NULL),
  (v_user_id, 'Sellita SW300-1', 'Sellita', 'mechanical_automatic', '28,800 vph', '42h', '52'),
  (v_user_id, 'Sellita SW330-2', 'Sellita', 'mechanical_automatic', '28,800 vph', '56h', NULL),
  (v_user_id, 'Sellita SW360-1', 'Sellita', 'mechanical_automatic', '28,800 vph', '42h', NULL),
  (v_user_id, 'Sellita SW500',   'Sellita', 'mechanical_automatic', '28,800 vph', '48h', '49'), -- 7750 clone
  (v_user_id, 'Sellita SW510',   'Sellita', 'mechanical_automatic', '28,800 vph', '58h', NULL),

  -- ── Miyota / Citizen (Japan) ─────────────────────────────────────
  (v_user_id, 'Miyota 8215',  'Miyota', 'mechanical_automatic', '21,600 vph', '40h', '49'),
  (v_user_id, 'Miyota 8205',  'Miyota', 'mechanical_automatic', '21,600 vph', '40h', NULL),
  (v_user_id, 'Miyota 8217',  'Miyota', 'mechanical_automatic', '21,600 vph', '40h', NULL),
  (v_user_id, 'Miyota 8245',  'Miyota', 'mechanical_automatic', '21,600 vph', '40h', NULL),
  (v_user_id, 'Miyota 9015',  'Miyota', 'mechanical_automatic', '28,800 vph', '42h', '51'),
  (v_user_id, 'Miyota 9039',  'Miyota', 'mechanical_automatic', '28,800 vph', '42h', NULL),
  (v_user_id, 'Miyota 9100',  'Miyota', 'mechanical_automatic', '28,800 vph', '60h', '51'),
  (v_user_id, 'Miyota 9120',  'Miyota', 'mechanical_automatic', '28,800 vph', '42h', NULL),
  (v_user_id, 'Miyota 90S5',  'Miyota', 'mechanical_automatic', '28,800 vph', '42h', NULL), -- open heart
  (v_user_id, 'Miyota 2035',  'Miyota', 'quartz',               NULL,         NULL,  NULL),
  (v_user_id, 'Miyota 2036',  'Miyota', 'quartz',               NULL,         NULL,  NULL),
  (v_user_id, 'Miyota OS20',  'Miyota', 'quartz',               NULL,         NULL,  NULL), -- chrono
  (v_user_id, 'Miyota 6S20',  'Miyota', 'quartz',               NULL,         NULL,  NULL),
  (v_user_id, 'Miyota 6S21',  'Miyota', 'quartz',               NULL,         NULL,  NULL),

  -- ── Rolex ────────────────────────────────────────────────────────
  (v_user_id, 'Rolex 3130',   'Rolex', 'mechanical_automatic', '28,800 vph', '48h', NULL),
  (v_user_id, 'Rolex 3135',   'Rolex', 'mechanical_automatic', '28,800 vph', '48h', '52'),
  (v_user_id, 'Rolex 3155',   'Rolex', 'mechanical_automatic', '28,800 vph', '50h', NULL),
  (v_user_id, 'Rolex 3186',   'Rolex', 'mechanical_automatic', '28,800 vph', '48h', NULL),
  (v_user_id, 'Rolex 3187',   'Rolex', 'mechanical_automatic', '28,800 vph', '48h', NULL),
  (v_user_id, 'Rolex 3230',   'Rolex', 'mechanical_automatic', '28,800 vph', '70h', NULL),
  (v_user_id, 'Rolex 3235',   'Rolex', 'mechanical_automatic', '28,800 vph', '70h', '53'),
  (v_user_id, 'Rolex 3255',   'Rolex', 'mechanical_automatic', '28,800 vph', '70h', NULL),
  (v_user_id, 'Rolex 3285',   'Rolex', 'mechanical_automatic', '28,800 vph', '70h', NULL),
  (v_user_id, 'Rolex 4130',   'Rolex', 'mechanical_automatic', '28,800 vph', '72h', NULL),
  (v_user_id, 'Rolex 4131',   'Rolex', 'mechanical_automatic', '28,800 vph', '72h', NULL),
  (v_user_id, 'Rolex 4161',   'Rolex', 'mechanical_automatic', '28,800 vph', '72h', NULL),
  (v_user_id, 'Rolex 7140',   'Rolex', 'mechanical_automatic', '28,800 vph', '55h', NULL), -- Perpetual 1908
  (v_user_id, 'Rolex 9001',   'Rolex', 'mechanical_automatic', '28,800 vph', '70h', NULL),
  (v_user_id, 'Rolex 2236',   'Rolex', 'mechanical_automatic', '28,800 vph', '55h', NULL),

  -- ── Omega ────────────────────────────────────────────────────────
  (v_user_id, 'Omega 1861',   'Omega', 'mechanical_manual',    '21,600 vph', '48h', NULL), -- Speedmaster
  (v_user_id, 'Omega 3861',   'Omega', 'mechanical_manual',    '21,600 vph', '50h', NULL), -- Co-axial Speedy
  (v_user_id, 'Omega 8500',   'Omega', 'mechanical_automatic', '25,200 vph', '60h', NULL),
  (v_user_id, 'Omega 8501',   'Omega', 'mechanical_automatic', '25,200 vph', '60h', NULL),
  (v_user_id, 'Omega 8520',   'Omega', 'mechanical_automatic', '25,200 vph', '50h', NULL),
  (v_user_id, 'Omega 8800',   'Omega', 'mechanical_automatic', '25,200 vph', '55h', NULL),
  (v_user_id, 'Omega 8801',   'Omega', 'mechanical_automatic', '25,200 vph', '55h', NULL),
  (v_user_id, 'Omega 8900',   'Omega', 'mechanical_automatic', '25,200 vph', '60h', NULL),
  (v_user_id, 'Omega 8901',   'Omega', 'mechanical_automatic', '25,200 vph', '60h', NULL),
  (v_user_id, 'Omega 9300',   'Omega', 'mechanical_automatic', '28,800 vph', '60h', NULL), -- chrono
  (v_user_id, 'Omega 9900',   'Omega', 'mechanical_automatic', '28,800 vph', '60h', NULL),
  (v_user_id, 'Omega 1120',   'Omega', 'mechanical_automatic', '28,800 vph', '44h', NULL),
  (v_user_id, 'Omega 2500',   'Omega', 'mechanical_automatic', '25,200 vph', '48h', NULL),
  (v_user_id, 'Omega 1424',   'Omega', 'quartz',               NULL,         NULL,  NULL),

  -- ── Tudor ────────────────────────────────────────────────────────
  (v_user_id, 'Tudor MT5400', 'Kenissi (Tudor)', 'mechanical_automatic', '28,800 vph', '70h', NULL),
  (v_user_id, 'Tudor MT5402', 'Kenissi (Tudor)', 'mechanical_automatic', '28,800 vph', '70h', NULL),
  (v_user_id, 'Tudor MT5601', 'Kenissi (Tudor)', 'mechanical_automatic', '28,800 vph', '70h', NULL),
  (v_user_id, 'Tudor MT5602', 'Kenissi (Tudor)', 'mechanical_automatic', '28,800 vph', '70h', NULL),
  (v_user_id, 'Tudor MT5612', 'Kenissi (Tudor)', 'mechanical_automatic', '28,800 vph', '70h', NULL),
  (v_user_id, 'Tudor MT5621', 'Kenissi (Tudor)', 'mechanical_automatic', '28,800 vph', '70h', NULL),
  (v_user_id, 'Tudor MT5641', 'Kenissi (Tudor)', 'mechanical_automatic', '28,800 vph', '70h', NULL),
  (v_user_id, 'Tudor MT5652', 'Kenissi (Tudor)', 'mechanical_automatic', '28,800 vph', '70h', NULL),
  (v_user_id, 'Tudor MT5813', 'Kenissi (Tudor)', 'mechanical_automatic', '28,800 vph', '70h', NULL), -- chrono
  (v_user_id, 'Tudor MT6918', 'Kenissi (Tudor)', 'mechanical_automatic', '28,800 vph', '70h', NULL),

  -- ── Patek Philippe ───────────────────────────────────────────────
  (v_user_id, 'PP 215 PS',  'Patek Philippe', 'mechanical_manual',    '28,800 vph', '44h', NULL),
  (v_user_id, 'PP 240',     'Patek Philippe', 'mechanical_automatic', '21,600 vph', '48h', NULL), -- micro-rotor
  (v_user_id, 'PP 324 SC',  'Patek Philippe', 'mechanical_automatic', '28,800 vph', '45h', NULL),
  (v_user_id, 'PP 26-330',  'Patek Philippe', 'mechanical_automatic', '28,800 vph', '45h', NULL),
  (v_user_id, 'PP CH 29',   'Patek Philippe', 'mechanical_manual',    '28,800 vph', '65h', NULL),
  (v_user_id, 'PP CH 28',   'Patek Philippe', 'mechanical_automatic', '28,800 vph', '55h', NULL),

  -- ── Jaeger-LeCoultre ─────────────────────────────────────────────
  (v_user_id, 'JLC 822',    'Jaeger-LeCoultre', 'mechanical_manual',    '28,800 vph', '45h', NULL), -- Reverso
  (v_user_id, 'JLC 849',    'Jaeger-LeCoultre', 'mechanical_manual',    '21,600 vph', '38h', NULL), -- ultra thin
  (v_user_id, 'JLC 854',    'Jaeger-LeCoultre', 'mechanical_manual',    '28,800 vph', '42h', NULL),
  (v_user_id, 'JLC 899',    'Jaeger-LeCoultre', 'mechanical_automatic', '28,800 vph', '38h', NULL),
  (v_user_id, 'JLC 925',    'Jaeger-LeCoultre', 'mechanical_manual',    '28,800 vph', '42h', NULL),
  (v_user_id, 'JLC 976',    'Jaeger-LeCoultre', 'mechanical_automatic', '28,800 vph', '45h', NULL),

  -- ── Audemars Piguet ──────────────────────────────────────────────
  (v_user_id, 'AP 2121',    'Audemars Piguet', 'mechanical_automatic', '19,800 vph', '40h', NULL),
  (v_user_id, 'AP 3120',    'Audemars Piguet', 'mechanical_automatic', '21,600 vph', '60h', NULL),
  (v_user_id, 'AP 3126',    'Audemars Piguet', 'mechanical_automatic', '21,600 vph', '60h', NULL),
  (v_user_id, 'AP 4302',    'Audemars Piguet', 'mechanical_automatic', '28,800 vph', '70h', NULL),
  (v_user_id, 'AP 4401',    'Audemars Piguet', 'mechanical_automatic', '28,800 vph', '70h', NULL), -- chrono

  -- ── Vacheron Constantin ──────────────────────────────────────────
  (v_user_id, 'VC 1120',    'Vacheron Constantin', 'mechanical_automatic', '19,800 vph', '40h', NULL),
  (v_user_id, 'VC 1326',    'Vacheron Constantin', 'mechanical_manual',    '28,800 vph', '65h', NULL),
  (v_user_id, 'VC 2160',    'Vacheron Constantin', 'mechanical_automatic', '21,600 vph', '80h', NULL),
  (v_user_id, 'VC 2755',    'Vacheron Constantin', 'mechanical_manual',    '21,600 vph', '58h', NULL),
  (v_user_id, 'VC 5100',    'Vacheron Constantin', 'mechanical_automatic', '28,800 vph', '60h', NULL),

  -- ── A. Lange & Söhne ────────────────────────────────────────────
  (v_user_id, 'Lange L901', 'A. Lange & Söhne', 'mechanical_manual',    '21,600 vph', '36h', NULL),
  (v_user_id, 'Lange L951', 'A. Lange & Söhne', 'mechanical_manual',    '18,000 vph', '60h', NULL),
  (v_user_id, 'Lange L961', 'A. Lange & Söhne', 'mechanical_automatic', '21,600 vph', '72h', NULL),

  -- ── Panerai (in-house) ───────────────────────────────────────────
  (v_user_id, 'Panerai P.5000', 'Panerai', 'mechanical_manual',    '21,600 vph', '192h', NULL), -- 8-day
  (v_user_id, 'Panerai P.6000', 'Panerai', 'mechanical_manual',    '21,600 vph', '72h',  NULL),
  (v_user_id, 'Panerai P.900',  'Panerai', 'mechanical_automatic', '28,800 vph', '72h',  NULL),
  (v_user_id, 'Panerai P.9000', 'Panerai', 'mechanical_automatic', '28,800 vph', '72h',  NULL),
  (v_user_id, 'Panerai P.9010', 'Panerai', 'mechanical_automatic', '28,800 vph', '72h',  NULL),
  (v_user_id, 'Panerai OP I',   'Panerai', 'mechanical_automatic', '28,800 vph', '42h',  NULL),
  (v_user_id, 'Panerai OP III', 'Panerai', 'mechanical_automatic', '28,800 vph', '42h',  NULL),

  -- ── IWC ──────────────────────────────────────────────────────────
  (v_user_id, 'IWC 30110',  'IWC', 'mechanical_automatic', '28,800 vph', '42h', NULL), -- ETA 2892 based
  (v_user_id, 'IWC 32110',  'IWC', 'mechanical_automatic', '28,800 vph', '120h', NULL),
  (v_user_id, 'IWC 51111',  'IWC', 'mechanical_automatic', '21,600 vph', '168h', NULL), -- 7-day
  (v_user_id, 'IWC 52010',  'IWC', 'mechanical_automatic', '28,800 vph', '168h', NULL),
  (v_user_id, 'IWC 69355',  'IWC', 'mechanical_automatic', '28,800 vph', '46h', NULL), -- chrono
  (v_user_id, 'IWC 79320',  'IWC', 'mechanical_automatic', '28,800 vph', '44h', NULL),
  (v_user_id, 'IWC 89361',  'IWC', 'mechanical_automatic', '28,800 vph', '68h', NULL),

  -- ── Hamilton ─────────────────────────────────────────────────────
  (v_user_id, 'Hamilton H-10',  'Hamilton', 'mechanical_automatic', '21,600 vph', '80h', '50'), -- C07 derivative
  (v_user_id, 'Hamilton H-20',  'Hamilton', 'mechanical_automatic', '21,600 vph', '80h', NULL),
  (v_user_id, 'Hamilton H-21',  'Hamilton', 'mechanical_automatic', '28,800 vph', '60h', NULL), -- chrono
  (v_user_id, 'Hamilton H-30',  'Hamilton', 'mechanical_automatic', '21,600 vph', '80h', NULL),
  (v_user_id, 'Hamilton H-31',  'Hamilton', 'mechanical_automatic', '28,800 vph', '60h', NULL),
  (v_user_id, 'Hamilton H-40',  'Hamilton', 'mechanical_manual',    '21,600 vph', '80h', NULL),

  -- ── Tissot / Mido (Powermatic family) ───────────────────────────
  (v_user_id, 'Tissot Powermatic 80', 'Tissot', 'mechanical_automatic', '21,600 vph', '80h', '50'),
  (v_user_id, 'Mido Caliber 80',      'Mido',   'mechanical_automatic', '21,600 vph', '80h', '50'),

  -- ── Longines ─────────────────────────────────────────────────────
  (v_user_id, 'Longines L888',   'Longines', 'mechanical_automatic', '25,200 vph', '64h', NULL),
  (v_user_id, 'Longines L893',   'Longines', 'mechanical_automatic', '25,200 vph', '72h', NULL),
  (v_user_id, 'Longines L688',   'Longines', 'mechanical_automatic', '28,800 vph', '54h', NULL), -- chrono
  (v_user_id, 'Longines L633',   'Longines', 'mechanical_automatic', '28,800 vph', '38h', NULL),

  -- ── Frederique Constant ──────────────────────────────────────────
  (v_user_id, 'FC-700', 'Frederique Constant', 'mechanical_automatic', '28,800 vph', '38h', NULL),
  (v_user_id, 'FC-710', 'Frederique Constant', 'mechanical_automatic', '28,800 vph', '38h', NULL),
  (v_user_id, 'FC-730', 'Frederique Constant', 'mechanical_automatic', '28,800 vph', '42h', NULL),
  (v_user_id, 'FC-980', 'Frederique Constant', 'mechanical_automatic', '28,800 vph', '38h', NULL),

  -- ── TAG Heuer ────────────────────────────────────────────────────
  (v_user_id, 'TAG Calibre 5',   'TAG Heuer', 'mechanical_automatic', '28,800 vph', '38h', NULL), -- SW200
  (v_user_id, 'TAG Calibre 16',  'TAG Heuer', 'mechanical_automatic', '28,800 vph', '42h', NULL), -- 7750
  (v_user_id, 'TAG Calibre 11',  'TAG Heuer', 'mechanical_automatic', '28,800 vph', '40h', NULL),
  (v_user_id, 'TAG Heuer 02',    'TAG Heuer', 'mechanical_automatic', '28,800 vph', '80h', NULL),

  -- ── Breitling ────────────────────────────────────────────────────
  (v_user_id, 'Breitling B01', 'Breitling', 'mechanical_automatic', '28,800 vph', '70h', NULL),
  (v_user_id, 'Breitling B04', 'Breitling', 'mechanical_automatic', '28,800 vph', '70h', NULL),
  (v_user_id, 'Breitling B20', 'Breitling', 'mechanical_automatic', '28,800 vph', '70h', NULL), -- Tudor MT5612
  (v_user_id, 'Breitling B40', 'Breitling', 'mechanical_automatic', '28,800 vph', '70h', NULL),

  -- ── Cartier ──────────────────────────────────────────────────────
  (v_user_id, 'Cartier 1847 MC', 'Cartier', 'mechanical_automatic', '28,800 vph', '42h', NULL),
  (v_user_id, 'Cartier 1904 MC', 'Cartier', 'mechanical_automatic', '28,800 vph', '48h', NULL),
  (v_user_id, 'Cartier 9750 MC', 'Cartier', 'mechanical_automatic', '28,800 vph', '48h', NULL),

  -- ── Zenith ───────────────────────────────────────────────────────
  (v_user_id, 'El Primero 400',   'Zenith', 'mechanical_automatic', '36,000 vph', '50h', NULL),
  (v_user_id, 'El Primero 3600',  'Zenith', 'mechanical_automatic', '36,000 vph', '60h', NULL),
  (v_user_id, 'Zenith Elite 670', 'Zenith', 'mechanical_automatic', '28,800 vph', '50h', NULL),

  -- ── Ronda (Swiss quartz) ─────────────────────────────────────────
  (v_user_id, 'Ronda 715',    'Ronda', 'quartz', NULL, NULL, NULL),
  (v_user_id, 'Ronda 763',    'Ronda', 'quartz', NULL, NULL, NULL),
  (v_user_id, 'Ronda 1063',   'Ronda', 'quartz', NULL, NULL, NULL),
  (v_user_id, 'Ronda 4220',   'Ronda', 'quartz', NULL, NULL, NULL),
  (v_user_id, 'Ronda 5040.F', 'Ronda', 'quartz', NULL, NULL, NULL), -- chrono
  (v_user_id, 'Ronda 6004.D', 'Ronda', 'quartz', NULL, NULL, NULL),
  (v_user_id, 'Ronda 9904',   'Ronda', 'quartz', NULL, NULL, NULL),
  (v_user_id, 'Ronda 9911',   'Ronda', 'quartz', NULL, NULL, NULL),

  -- ── Soprod / STP ─────────────────────────────────────────────────
  (v_user_id, 'Soprod A10',    'Soprod', 'mechanical_automatic', '28,800 vph', '42h', NULL),
  (v_user_id, 'Soprod M100',   'Soprod', 'mechanical_automatic', '28,800 vph', '42h', NULL),
  (v_user_id, 'STP 1-11',      'STP',    'mechanical_automatic', '28,800 vph', '44h', '52'),
  (v_user_id, 'STP 6-15',      'STP',    'mechanical_automatic', '28,800 vph', '44h', NULL),
  (v_user_id, 'STP 3-13',      'STP',    'mechanical_automatic', '28,800 vph', '44h', NULL),

  -- ── Citizen (Eco-Drive / mechanical) ─────────────────────────────
  (v_user_id, 'Citizen 8200', 'Citizen', 'mechanical_automatic', '21,600 vph', '40h', NULL),
  (v_user_id, 'Citizen 9015', 'Citizen', 'mechanical_automatic', '28,800 vph', '42h', '51'),
  (v_user_id, 'Eco-Drive E660', 'Citizen', 'quartz', NULL, NULL, NULL),
  (v_user_id, 'Eco-Drive B620', 'Citizen', 'quartz', NULL, NULL, NULL),
  (v_user_id, 'Eco-Drive H800', 'Citizen', 'quartz', NULL, NULL, NULL),
  (v_user_id, 'Eco-Drive A660', 'Citizen', 'quartz', NULL, NULL, NULL),

  -- ── Chinese movements (popular in micro-brands) ─────────────────
  (v_user_id, 'Sea-Gull ST16',  'Sea-Gull', 'mechanical_automatic', '21,600 vph', '40h', NULL),
  (v_user_id, 'Sea-Gull ST19',  'Sea-Gull', 'mechanical_manual',    '21,600 vph', '40h', NULL), -- 1963 chrono
  (v_user_id, 'Sea-Gull ST21',  'Sea-Gull', 'mechanical_automatic', '21,600 vph', '40h', NULL),
  (v_user_id, 'Sea-Gull ST25',  'Sea-Gull', 'mechanical_automatic', '21,600 vph', '40h', NULL),
  (v_user_id, 'Sea-Gull ST36',  'Sea-Gull', 'mechanical_manual',    '18,000 vph', '40h', NULL), -- 6497 clone
  (v_user_id, 'Hangzhou 7750',  'Hangzhou', 'mechanical_automatic', '28,800 vph', '40h', NULL),
  (v_user_id, 'Hangzhou 2000',  'Hangzhou', 'mechanical_automatic', '28,800 vph', '38h', NULL),

  -- ── Vintage / discontinued favorites ─────────────────────────────
  (v_user_id, 'Valjoux 7733',  'Valjoux',  'mechanical_manual',    '18,000 vph', '45h', NULL),
  (v_user_id, 'Valjoux 7734',  'Valjoux',  'mechanical_manual',    '18,000 vph', '45h', '48'),
  (v_user_id, 'Valjoux 7750',  'Valjoux',  'mechanical_automatic', '28,800 vph', '44h', '49'),
  (v_user_id, 'Lemania 1873',  'Lemania',  'mechanical_manual',    '21,600 vph', '45h', NULL),
  (v_user_id, 'Lemania 5100',  'Lemania',  'mechanical_automatic', '28,800 vph', '48h', NULL),
  (v_user_id, 'AS 1900',       'AS',       'mechanical_automatic', '21,600 vph', '40h', '52'),
  (v_user_id, 'AS 1700',       'AS',       'mechanical_automatic', '18,000 vph', '40h', NULL),
  (v_user_id, 'FHF 72',        'FHF',      'mechanical_manual',    '18,000 vph', '38h', NULL),
  (v_user_id, 'ETA 2783',      'ETA',      'mechanical_automatic', '21,600 vph', '40h', NULL),
  (v_user_id, 'Peseux 320',    'Peseux',   'mechanical_manual',    '18,000 vph', '42h', NULL),
  (v_user_id, 'Unitas 6325',   'Unitas',   'mechanical_manual',    '18,000 vph', '40h', NULL),
  (v_user_id, 'Seiko 6309',    'Seiko',    'mechanical_automatic', '21,600 vph', '40h', NULL),
  (v_user_id, 'Seiko 6105',    'Seiko',    'mechanical_automatic', '21,600 vph', '40h', NULL),
  (v_user_id, 'Seiko 6139',    'Seiko',    'mechanical_automatic', '21,600 vph', '40h', '54.5')

  ON CONFLICT (user_id, caliber_name) DO NOTHING;

  RAISE NOTICE 'Movement seed complete.';
END $$;

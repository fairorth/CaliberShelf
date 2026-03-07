-- Seed ~60 common watch movements as system-level entries (user_id = NULL)
-- These are read-only for all users, providing a shared reference database.
--
-- Tier 1: Workhorse movements found in everyday watches (~30)
-- Tier 2: Manufacture/luxury calibers (~20)
-- Tier 3: Specialty / notable calibers (~10)

INSERT INTO public.movements (
  user_id, caliber_name, manufacturer, base_caliber, movement_type, display_type,
  diameter_mm, height_mm, jewel_count, beat_rate_vph, power_reserve_hours,
  hacking, hand_windable, quickset_date, complications, country_of_origin
) VALUES

-- ═══════════════════════════════════════════════════════════════
-- TIER 1: Workhorse movements
-- ═══════════════════════════════════════════════════════════════

-- ETA (Swiss)
(NULL, 'ETA 2824-2', 'ETA', NULL, 'automatic', 'analog',
 25.60, 4.60, 25, 28800, 38,
 true, true, true, 'Date', 'Switzerland'),

(NULL, 'ETA 2892-A2', 'ETA', NULL, 'automatic', 'analog',
 25.60, 3.60, 21, 28800, 42,
 true, true, true, 'Date', 'Switzerland'),

(NULL, 'ETA 7750', 'ETA', 'Valjoux 7750', 'automatic', 'analog',
 30.00, 7.90, 25, 28800, 48,
 false, true, true, 'Chronograph, Date, Day', 'Switzerland'),

(NULL, 'ETA 2836-2', 'ETA', NULL, 'automatic', 'analog',
 25.60, 5.05, 25, 28800, 38,
 true, true, true, 'Date, Day', 'Switzerland'),

(NULL, 'ETA 6497', 'ETA', 'Unitas 6497', 'manual_wind', 'analog',
 36.60, 4.50, 17, 21600, 46,
 false, true, false, NULL, 'Switzerland'),

(NULL, 'ETA 6498', 'ETA', 'Unitas 6498', 'manual_wind', 'analog',
 36.60, 4.50, 17, 21600, 46,
 false, true, false, 'Small seconds', 'Switzerland'),

(NULL, 'ETA 2671', 'ETA', NULL, 'automatic', 'analog',
 17.20, 4.80, 25, 28800, 38,
 true, false, true, 'Date', 'Switzerland'),

-- Sellita (Swiss)
(NULL, 'Sellita SW200-1', 'Sellita', NULL, 'automatic', 'analog',
 25.60, 4.60, 26, 28800, 38,
 true, true, true, 'Date', 'Switzerland'),

(NULL, 'Sellita SW300-1', 'Sellita', NULL, 'automatic', 'analog',
 25.60, 3.60, 25, 28800, 42,
 true, true, true, 'Date', 'Switzerland'),

(NULL, 'Sellita SW500', 'Sellita', NULL, 'automatic', 'analog',
 30.00, 7.90, 25, 28800, 48,
 false, true, true, 'Chronograph, Date, Day', 'Switzerland'),

(NULL, 'Sellita SW510', 'Sellita', NULL, 'automatic', 'analog',
 30.00, 7.90, 25, 28800, 48,
 true, true, true, 'Chronograph, Date', 'Switzerland'),

-- Seiko (Japan)
(NULL, 'Seiko NH35A', 'Seiko', '4R35', 'automatic', 'analog',
 27.40, 5.32, 24, 21600, 41,
 true, true, true, 'Date', 'Japan'),

(NULL, 'Seiko NH36A', 'Seiko', '4R36', 'automatic', 'analog',
 27.40, 5.32, 24, 21600, 41,
 true, true, true, 'Date, Day', 'Japan'),

(NULL, 'Seiko 4R36', 'Seiko', NULL, 'automatic', 'analog',
 27.40, 5.32, 24, 21600, 41,
 true, true, true, 'Date, Day', 'Japan'),

(NULL, 'Seiko 6R35', 'Seiko', NULL, 'automatic', 'analog',
 27.40, 5.32, 24, 21600, 70,
 true, true, true, 'Date', 'Japan'),

(NULL, 'Seiko 7S26', 'Seiko', NULL, 'automatic', 'analog',
 27.40, 5.32, 21, 21600, 41,
 false, false, true, 'Date, Day', 'Japan'),

(NULL, 'Seiko NE15', 'Seiko', '6R15', 'automatic', 'analog',
 27.40, 5.32, 23, 21600, 50,
 true, true, true, 'Date', 'Japan'),

(NULL, 'Seiko V175', 'Seiko', NULL, 'solar', 'analog',
 27.40, 5.00, 0, 32768, 4320,
 false, false, true, 'Chronograph, Date', 'Japan'),

-- Miyota (Japan)
(NULL, 'Miyota 9015', 'Miyota', NULL, 'automatic', 'analog',
 26.00, 3.90, 24, 28800, 42,
 true, true, true, 'Date', 'Japan'),

(NULL, 'Miyota 8215', 'Miyota', NULL, 'automatic', 'analog',
 26.00, 4.80, 21, 21600, 42,
 false, false, true, 'Date', 'Japan'),

(NULL, 'Miyota 82S0', 'Miyota', NULL, 'automatic', 'analog',
 26.00, 5.67, 21, 21600, 42,
 true, true, true, 'Date, Skeleton', 'Japan'),

-- Ronda (Swiss quartz)
(NULL, 'Ronda 715', 'Ronda', NULL, 'quartz', 'analog',
 25.60, 3.65, 0, 32768, NULL,
 false, false, true, 'Date', 'Switzerland'),

(NULL, 'Ronda 505', 'Ronda', NULL, 'quartz', 'analog',
 23.30, 2.50, 0, 32768, NULL,
 false, false, false, NULL, 'Switzerland'),

(NULL, 'Ronda 5021.D', 'Ronda', NULL, 'quartz', 'analog',
 23.30, 5.20, 0, 32768, NULL,
 false, false, true, 'Chronograph, Date', 'Switzerland'),

-- Soprod (Swiss)
(NULL, 'Soprod A10', 'Soprod', NULL, 'automatic', 'analog',
 25.60, 4.60, 26, 28800, 42,
 true, true, true, 'Date', 'Switzerland'),

-- Citizen (Japan)
(NULL, 'Citizen E210', 'Citizen', NULL, 'solar', 'analog',
 25.60, 4.48, 0, 32768, 5040,
 false, false, true, 'Date', 'Japan'),

(NULL, 'Citizen 8200', 'Citizen', NULL, 'automatic', 'analog',
 25.60, 4.84, 21, 21600, 40,
 true, true, true, 'Date', 'Japan'),

-- ═══════════════════════════════════════════════════════════════
-- TIER 2: Manufacture / luxury calibers
-- ═══════════════════════════════════════════════════════════════

-- Rolex
(NULL, 'Rolex 3135', 'Rolex', NULL, 'automatic', 'analog',
 28.50, 6.00, 31, 28800, 48,
 true, false, true, 'Date', 'Switzerland'),

(NULL, 'Rolex 3235', 'Rolex', NULL, 'automatic', 'analog',
 31.80, 6.40, 31, 28800, 70,
 true, false, true, 'Date', 'Switzerland'),

(NULL, 'Rolex 4130', 'Rolex', NULL, 'automatic', 'analog',
 30.50, 6.50, 44, 28800, 72,
 true, false, true, 'Chronograph, Date', 'Switzerland'),

(NULL, 'Rolex 3285', 'Rolex', NULL, 'automatic', 'analog',
 31.80, 6.40, 31, 28800, 70,
 true, false, true, 'Date, GMT', 'Switzerland'),

-- Omega
(NULL, 'Omega 8900', 'Omega', NULL, 'automatic', 'analog',
 29.00, 5.70, 39, 25200, 60,
 true, false, true, 'Date', 'Switzerland'),

(NULL, 'Omega 3861', 'Omega', NULL, 'manual_wind', 'analog',
 27.40, 5.58, 26, 21600, 50,
 true, true, false, 'Chronograph, Small seconds', 'Switzerland'),

(NULL, 'Omega 9900', 'Omega', NULL, 'automatic', 'analog',
 33.00, 7.60, 54, 25200, 60,
 true, false, true, 'Chronograph, Date', 'Switzerland'),

(NULL, 'Omega 8800', 'Omega', NULL, 'automatic', 'analog',
 29.00, 5.20, 35, 25200, 55,
 true, false, true, 'Date', 'Switzerland'),

-- Tudor
(NULL, 'Tudor MT5402', 'Tudor', NULL, 'automatic', 'analog',
 26.00, 4.78, 26, 28800, 70,
 true, false, false, NULL, 'Switzerland'),

(NULL, 'Tudor MT5612', 'Tudor', NULL, 'automatic', 'analog',
 26.00, 6.10, 25, 28800, 70,
 true, false, true, 'Date, GMT', 'Switzerland'),

-- Grand Seiko
(NULL, 'Grand Seiko 9F85', 'Grand Seiko', NULL, 'quartz', 'analog',
 22.00, 3.50, 7, 32768, NULL,
 false, false, true, 'Date', 'Japan'),

(NULL, 'Grand Seiko 9R65', 'Grand Seiko', NULL, 'spring_drive', 'analog',
 28.60, 5.80, 30, 28800, 72,
 true, false, true, 'Date, Power reserve', 'Japan'),

(NULL, 'Grand Seiko 9SA5', 'Grand Seiko', NULL, 'automatic', 'analog',
 31.00, 5.18, 47, 36000, 80,
 true, false, true, 'Date', 'Japan'),

(NULL, 'Grand Seiko 9RA5', 'Grand Seiko', NULL, 'spring_drive', 'analog',
 31.00, 5.18, 50, 36000, 120,
 true, false, true, 'Date, Power reserve', 'Japan'),

-- Zenith
(NULL, 'Zenith El Primero 400', 'Zenith', NULL, 'automatic', 'analog',
 30.00, 6.60, 31, 36000, 50,
 true, true, true, 'Chronograph, Date', 'Switzerland'),

(NULL, 'Zenith El Primero 3600', 'Zenith', NULL, 'automatic', 'analog',
 30.00, 6.60, 46, 36000, 60,
 true, true, true, 'Chronograph, Date, 1/10th second', 'Switzerland'),

-- Breitling
(NULL, 'Breitling B01', 'Breitling', NULL, 'automatic', 'analog',
 30.00, 7.20, 47, 28800, 70,
 true, true, true, 'Chronograph, Date', 'Switzerland'),

-- IWC
(NULL, 'IWC 69000', 'IWC', NULL, 'automatic', 'analog',
 30.00, 5.50, 28, 28800, 46,
 true, true, true, 'Date', 'Switzerland'),

(NULL, 'IWC 82000', 'IWC', NULL, 'automatic', 'analog',
 37.80, 8.50, 45, 28800, 168,
 true, true, true, 'Date, Day, Month, Year, Perpetual calendar, Moon phase', 'Switzerland'),

-- TAG Heuer
(NULL, 'TAG Heuer TH20-00', 'TAG Heuer', 'Sellita SW200', 'automatic', 'analog',
 25.60, 4.60, 26, 28800, 38,
 true, true, true, 'Date', 'Switzerland'),

-- ═══════════════════════════════════════════════════════════════
-- TIER 3: High-end / specialty calibers
-- ═══════════════════════════════════════════════════════════════

-- Jaeger-LeCoultre
(NULL, 'JLC 899/1', 'Jaeger-LeCoultre', NULL, 'automatic', 'analog',
 26.00, 3.30, 19, 28800, 45,
 true, false, true, 'Date', 'Switzerland'),

(NULL, 'JLC 956', 'Jaeger-LeCoultre', NULL, 'manual_wind', 'analog',
 20.00, 1.85, 19, 21600, 45,
 false, true, false, NULL, 'Switzerland'),

-- Patek Philippe
(NULL, 'Patek 324 SC', 'Patek Philippe', NULL, 'automatic', 'analog',
 27.00, 3.30, 29, 28800, 45,
 true, false, true, 'Date', 'Switzerland'),

(NULL, 'Patek 240', 'Patek Philippe', NULL, 'automatic', 'analog',
 27.50, 2.53, 27, 21600, 48,
 false, false, false, 'Small seconds', 'Switzerland'),

(NULL, 'Patek CH 29-535 PS', 'Patek Philippe', NULL, 'manual_wind', 'analog',
 29.60, 5.35, 33, 28800, 65,
 false, true, false, 'Chronograph, Small seconds', 'Switzerland'),

-- A. Lange & Söhne
(NULL, 'Lange L951.6', 'A. Lange & Söhne', NULL, 'manual_wind', 'analog',
 30.60, 5.70, 40, 21600, 72,
 true, true, false, 'Chronograph, Flyback', 'Germany'),

(NULL, 'Lange L095.4', 'A. Lange & Söhne', NULL, 'manual_wind', 'analog',
 28.60, 4.60, 21, 21600, 72,
 true, true, false, NULL, 'Germany'),

-- Vacheron Constantin
(NULL, 'Vacheron 1120', 'Vacheron Constantin', 'JLC 920', 'automatic', 'analog',
 28.00, 2.45, 36, 19800, 40,
 false, false, false, NULL, 'Switzerland'),

-- Audemars Piguet
(NULL, 'AP 4401', 'Audemars Piguet', NULL, 'automatic', 'analog',
 32.00, 6.80, 40, 28800, 70,
 true, false, true, 'Chronograph, Date', 'Switzerland'),

(NULL, 'AP 4302', 'Audemars Piguet', NULL, 'automatic', 'analog',
 32.00, 4.26, 40, 28800, 70,
 true, false, true, 'Date', 'Switzerland'),

-- Nomos
(NULL, 'Nomos Alpha', 'Nomos Glashütte', NULL, 'manual_wind', 'analog',
 23.30, 2.60, 17, 21600, 43,
 true, true, false, 'Small seconds', 'Germany'),

(NULL, 'Nomos DUW 3001', 'Nomos Glashütte', NULL, 'automatic', 'analog',
 29.00, 3.20, 26, 21600, 42,
 true, false, true, 'Date', 'Germany'),

-- Casio (digital / quartz)
(NULL, 'Casio 3159', 'Casio', NULL, 'quartz', 'digital',
 NULL, NULL, 0, 32768, NULL,
 false, false, false, 'Alarm, Countdown timer, Stopwatch, World time', 'Japan'),

(NULL, 'Casio 5611', 'Casio', NULL, 'solar', 'digital',
 NULL, NULL, 0, 32768, NULL,
 false, false, false, 'Alarm, Countdown timer, Stopwatch, World time, Atomic sync', 'Japan');

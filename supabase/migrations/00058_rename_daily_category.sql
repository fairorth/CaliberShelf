-- 00058_rename_daily_category.sql
-- Marc's call (2026-10-21, for Rate My Watches segments): the "Daily"
-- category becomes "Tool / Field" — more descriptive, and where divers sit in
-- this collection. Categories are user rows, so this is a data change: the
-- id is kept, so every watch, filter link and report follows automatically.
-- Idempotent: a second run finds no "Daily" left.

UPDATE public.categories
SET name = 'Tool / Field'
WHERE name = 'Daily';

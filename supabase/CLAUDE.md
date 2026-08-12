# Supabase Conventions

## Migrations
- Sequential numbering: `00001_description.sql`, `00002_description.sql`
- Each migration is a single logical change (one table or set of related policies)
- Always include `IF NOT EXISTS` guards for idempotency
- After creating a migration: run SQL in Supabase SQL Editor (no CLI push — hosted Supabase). Migrations are applied BY HAND, so always tell the user which file to run.
- Latest applied migration: `00040_create_watch_image_scores.sql` (photo-scoring agent; confirmed applied 2026-08-10). See docs/data-model.md for the table catalog.
- PENDING (v2 Phase 3 — run these in the SQL Editor): `00041_add_watch_photo_angle_sort.sql` (watch_photos.angle + sort_order) and `00042_add_image_score_review_state.sql` (watch_image_scores.review_state + reviewed_at). The Photo Lab and photo angle tags need both.
- `ALTER TABLE RENAME` preserves existing FK relationships — preferred over drop-and-recreate
- When renaming tables, also rename: RLS policies, triggers, indexes, and FK column references
- Junction tables (many-to-many): use composite PK, cascade deletes, and RLS that joins to the parent table's owner

## RLS Policies
- EVERY table MUST have RLS enabled: `ALTER TABLE tablename ENABLE ROW LEVEL SECURITY;`
- Owner-only pattern: `auth.uid() = user_id`
- Future public sharing uses `is_public = true` OR owner check
- Policy naming: `{table}_{operation}_{scope}` (e.g., `watches_select_owner`)

## Type Generation
- After any schema change, regenerate types from the Supabase dashboard or CLI
- Generated types go in `src/lib/types/database.ts`
- App-level types in `src/lib/types/watch.ts` reference generated types

## Storage Buckets
- `watch-photos` bucket: private, 5MB max, image/* only
- Storage path convention: `{user_id}/{watch_id}/{uuid}.{ext}`
- Access controlled via RLS policies on storage.objects
- Display photos using signed URLs (valid 1 hour)

## Money Storage
- All monetary values stored as BIGINT cents (e.g., $150.00 = 15000)
- Currency stored as separate TEXT column (default 'USD')
- Format for display only at the UI layer

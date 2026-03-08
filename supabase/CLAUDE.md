# Supabase Conventions

## Migrations
- Sequential numbering: `00001_description.sql`, `00002_description.sql`
- Each migration is a single logical change (one table or set of related policies)
- Always include `IF NOT EXISTS` guards for idempotency
- After creating a migration: run SQL in Supabase SQL Editor (no CLI push — hosted Supabase)
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

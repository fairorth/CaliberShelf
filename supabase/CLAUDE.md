# Supabase Conventions

## Migrations
- Sequential numbering: `00001_description.sql`, `00002_description.sql`
- Each migration is a single logical change (one table or set of related policies)
- Always include `IF NOT EXISTS` guards for idempotency
- After creating a migration: run SQL in Supabase SQL Editor (no CLI push — hosted Supabase). Migrations are applied BY HAND, so always tell the user which file to run.
- Latest applied migration: `00053_tier_valuations.sql`
  (confirmed applied 2026-09-05 — everything through 00053 is live, 00052
  included). See docs/data-model.md for the table catalog.
- `00053` widened `watch_valuations.source` to allow `'tier'` and `run_mode` to
  allow `'static'`, and added the partial unique index that holds a watch to one
  static valuation. Applied 2026-09-05, immediately followed by
  `npm run refresh-tier-valuations` — 115 static valuations written.
  Both CHECK constraints were dropped by DEFINITION rather than by assumed name
  (they were created inline by ADD COLUMN, so Postgres named them): a widened
  constraint added alongside a surviving narrow one looks like it worked and
  still rejects every insert.
- `00051` added `watches.attachment` (TEXT + CHECK: max|high|medium|low,
  nullable), moved every `sale_status = 'candidate'` row back to `'owned'`, and
  DROPPED `candidate_since` / `candidate_note`. The `'candidate'` value remains
  in the `sale_status` enum deliberately — dropping an enum value means
  recreating the type — but no row holds it and no code path can write it.
- `00048` is applied; **`npm run backfill-photo-dimensions` may still be
  outstanding.** Until it runs, existing photos read NULL width/height, which
  is the supported "3:2 fallback, excluded from aspect comparison" path — the
  app is correct, just not measured.
- Phase 5 set (all applied): `00043_add_cost_basis_lifecycle_ask.sql`, `00044_create_watch_listings.sql`, `00045_create_watch_sales.sql`, `00046_add_valuation_source.sql`, `00047_backfill_sale_status.sql`.
- `cost_basis_cents` (00043) and `net_proceeds_cents` (00045) are
  `GENERATED ALWAYS … STORED`. Never write them, never re-derive them in a
  query — that is the whole point of generating them.
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

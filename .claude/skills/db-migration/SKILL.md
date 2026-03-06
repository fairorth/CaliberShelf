---
name: db-migration
description: Create a new Supabase database migration with RLS policies
user-invocable: true
argument-hint: [migration-description]
---

Create a new Supabase migration for: $ARGUMENTS

## Steps
1. Determine the next migration number (check `supabase/migrations/` for highest number)
2. Create `supabase/migrations/{next_number}_$ARGUMENTS.sql`
3. Write the SQL migration with:
   - `IF NOT EXISTS` guards
   - `ENABLE ROW LEVEL SECURITY` on any new tables
   - RLS policies following owner-only pattern: `auth.uid() = user_id`
   - Appropriate indexes for common query patterns
4. After writing the migration, remind user to:
   - Run `npx supabase db push` to apply
   - Run `npx supabase gen types typescript --project-id <ref> > src/lib/types/database.ts` to regenerate types
5. Update app-level types in `src/lib/types/` if needed

## RLS Policy Template
```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

CREATE POLICY "table_select_owner" ON table_name
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "table_insert_owner" ON table_name
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "table_update_owner" ON table_name
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "table_delete_owner" ON table_name
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
```

## Naming Conventions
- Migration files: `00001_create_table_name.sql`
- Policies: `{table}_{operation}_{scope}` (e.g., `watches_select_owner`)
- Indexes: `idx_{table}_{column}` (e.g., `idx_watches_user_id`)

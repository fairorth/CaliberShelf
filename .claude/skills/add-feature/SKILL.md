---
name: add-feature
description: Plan and implement a new feature end-to-end following WatchTracker conventions
user-invocable: true
argument-hint: [feature-description]
---

Plan and implement: $ARGUMENTS

## Planning Phase
Before writing code, identify which layers need changes:

| Layer | Location | Needed? |
|-------|----------|---------|
| Database schema | `supabase/migrations/` | |
| Zod validation | `src/lib/validations/` | |
| Query functions | `src/lib/queries/` | |
| Server Actions | `src/lib/actions/` | |
| App types | `src/lib/types/` | |
| New routes | `src/app/(dashboard)/` | |
| Shared components | `src/components/` | |
| Route components | `_components/` in route dir | |
| Client hooks (SWR) | `src/hooks/` | |

Check for existing patterns in similar features before creating new ones.

## Implementation Order
Always implement in this order to avoid type errors and missing dependencies:

1. **Database migration** (if needed) + regenerate types
2. **Zod validation schemas** (shared between client and server)
3. **Query functions** (reads, used by Server Components)
4. **Server Actions** (mutations: create, update, delete)
5. **Server Components** (pages that fetch and pass data)
6. **Client Components** (interactive UI: forms, charts, pickers)
7. **Wire up navigation** (add to sidebar if it's a new route)

## Verification
After implementing:
1. Run `npm run typecheck` to verify no type errors
2. Run `npm run lint` to check code quality
3. Test manually via the dev server

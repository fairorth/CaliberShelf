# Route Conventions

## Server vs Client Components
- Pages (`page.tsx`) and layouts (`layout.tsx`) are Server Components by default
- Fetch data in Server Components using functions from `src/lib/queries/`
- Interactive UI (forms, charts, dropdowns) uses Client Components in `_components/`
- Pass server-fetched data down to Client Components as props

## Data Fetching Pattern
```tsx
// page.tsx (Server Component)
import { getWatchById } from "@/lib/queries/watches"
import { WatchDetail } from "./_components/watch-detail-header"

export default async function WatchPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const watch = await getWatchById(id)
  if (!watch) notFound()
  return <WatchDetail watch={watch} />
}
```

## Mutations Pattern
- All mutations use Server Actions from `src/lib/actions/`
- Server Actions call `revalidatePath()` to refresh data after mutations
- Forms call server actions directly or via `useTransition` + `startTransition`

## Route Groups
- `(auth)` - Unauthenticated pages (login, signup). No sidebar or nav.
- `(dashboard)` - Authenticated pages. Layout includes sidebar nav and auth check.

## Private Folders
- `_components/` inside each route holds route-specific components
- The underscore prefix opts them out of the routing system
- Only truly shared components go in `src/components/`

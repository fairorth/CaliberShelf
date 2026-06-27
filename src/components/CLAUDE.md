# Component Conventions

## shadcn/ui
- Components in `ui/` are managed by `npx shadcn@latest add <name>` — do not create manually
- Customizing a shadcn component: edit the file in `ui/` directly (they are project-owned)
- Import shadcn components from `@/components/ui/<name>`
- Use `sonner` for toasts (the `toast` component is deprecated in shadcn/ui v4)
- NEVER manually edit `package-lock.json` — use npm commands instead

## Shared Components
- Use named exports: `export function WatchForm() {}`
- Props interface defined above the component: `interface WatchFormProps {}`
- Client Components must have "use client" at the top of the file
- Use React Hook Form + Zod for all forms: `useForm<z.infer<typeof watchSchema>>()`
- Pass Server Actions to forms via `action` prop or call via `startTransition`

## File Naming
- Lowercase kebab-case: `watch-card.tsx`, `photo-uploader.tsx`
- One component per file (small helpers can be co-located)
- No barrel exports; import directly from the file

## Styling
- Tailwind utility classes only; no CSS modules or styled-components
- Use `cn()` from `@/lib/utils` for conditional classes
- Use shadcn/ui color tokens: `bg-primary`, `text-muted-foreground`, etc.
- Mobile-first responsive: use `sm:`, `md:`, `lg:` breakpoints

## Common Patterns
- Inline table editing: extract a `Row` component with `useState(editing)` + `useTransition` for save — avoids form-level state conflicts
- Color maps: define a `Record<ColorName, { bg: string; text: string }>` with Tailwind classes for consistent badge/tag styling
- Watch dial (`watch-dial.tsx`): 12 hour positions hold random unique watches (NOT category-based anymore), index 0=12 o'clock. Dressed as a full wristwatch — smoked-blue sunburst face, polished domed silver bezel, leather strap (top+bottom), four lugs, and a fluted crown at 3 o'clock. Strap/lugs/crown render before the bezel in DOM so the round case paints over their inner ends.

## Stacking Context Gotchas
- `transform: translate(...)` / `scale(...)` on a positioned element creates a new stacking context, **trapping** inner `z-index`. To lift an element above its siblings on hover, set `hover:z-50` on the transformed wrapper itself, not on a child.
- z-index requires `position` non-static — `hover:z-50` on a class with no position (e.g. a default-flow `<Link>`) is silently ignored.

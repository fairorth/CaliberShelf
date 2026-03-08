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
- Watch dial: categories map to positions via `display_order` (0=12 o'clock, 1=1 o'clock, etc.)

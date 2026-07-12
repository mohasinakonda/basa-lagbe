# Coding Guidelines

## Standards for writing code in **Basa Lagbe**

## Scope and quality

- Change only what the task needs. No drive-by refactors, unrelated files, or “cleanup” outside scope.
- Match surrounding code: imports (`@/` aliases), quotes, semicolons, component patterns, and comment style.
- Prefer extending existing helpers/components over duplicating logic.
- Avoid unnecessary `try/catch`; handle errors meaningfully or let them propagate where appropriate.
- Do not add new markdown/docs unless the user asked for documentation.
- Write production-ready code (no pseudo-code or placeholder logic).
- Always include imports; provide complete working code; no missing dependencies.
- Comments only when necessary — avoid obvious comments.

---

## TypeScript

- Use **strict** typing; avoid `any`.
- Prefer **explicit types** on public APIs and non-obvious values; rely on inference for locals when clear.
- Use `type` for unions/intersections; `interface` for object shapes (especially when extending).
- Avoid `as` assertions to silence errors; fix the underlying type.
- Prefer explicit prop types over `any`.

---

## Naming

| Kind                        | Convention                                                                           | Examples                                       |
| --------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------- |
| Components & types          | `PascalCase`                                                                         | `FilterBar`, `ListingDetailSidebar`            |
| Files                       | Match primary symbol; prefer kebab-case                                              | `filter-bar.tsx`, `listing-detail-sidebar.tsx` |
| Functions, variables, props | `camelCase`                                                                          | `onSortModeChange`, `searchQuery`              |
| Module-level constants      | `SCREAMING_SNAKE_CASE` only when truly constant; otherwise `camelCase` or `as const` |                                                |
| Booleans                    | Prefix with `is`, `has`, `can`, `should`                                             | `canSortByDistance`                            |
| Event handlers              | `onX` on props; `handleX` for internal handlers when both exist                      | `onSubmit` / `handleSubmit`                    |

Do **not** use single-character variable, argument, or parameter names.

---

## React & Next.js

- Use **functional components**. Prefer named exports.
- Add `'use client'` **only** when the file needs client APIs (hooks, browser APIs, event handlers).
- Keep **server/client boundaries** clear: do not pull server-only modules into client components.
- Colocate small UI pieces in the same file; extract when reuse or clarity demands it.
- Type props with `interface` or `type`; export when reused.
- Prefer **composition** over inheritance; keep components small, reusable, and modular.
- Separate UI from business logic when it clarifies structure.
- Include **loading**, **empty**, and **error** states for user-facing async UI.
- Handle edge cases explicitly.

---

## Data fetching and mutations

- Prefer **Server Components** for reads to reduce client JS.
- Prefer **Server Actions** for mutations (create/update/delete) triggered from the UI (`app/actions/`).
- Use **hooks** for fetching only when data must be loaded on the client; otherwise prefer server actions / server components.
- Keep state **minimal and colocated**; avoid prop drilling where a clearer pattern already exists in the codebase.

---

## Styling (Tailwind)

- Use utility classes consistent with existing components.
- Reuse patterns and design tokens from `app/globals.css` (e.g. `bg-surface`, `text-muted-foreground`, `border-border`).
- Use the `cn()` helper from `lib/tailwind-merge.ts` (clsx + tailwind-merge) when merging conditional classes.
- Prefer existing primitives in `components/UI/` over inventing parallel inputs/buttons.

---

## Accessibility

Strict a11y expectations:

- Use semantic HTML elements.
- All interactive elements must be keyboard accessible.
- Use `button` (not `div`) for clickable actions.
- Add `alt` text for images.
- Use ARIA attributes when needed (`aria-*`, labels).
- Preserve focus states.
- Use proper heading hierarchy (`h1` → `h6`).
- Modals must trap focus and close on Escape.

---

## Performance

- Avoid unnecessary re-renders: lift state only when needed; memoize expensive work only when proven necessary.
- Prefer `useMemo` / `useCallback` only when necessary.
- Use dynamic import for heavy components (e.g. maps).
- Optimize images and assets (ImageKit / Next.js image config).

---

## Imports

- Use the `@/` path alias for project imports.
- Prefer clear module boundaries (`@/lib/...`, `@/components/...`, `@/types/...`) over deep relative paths (`../../../`).

---

## Related docs

- [Project overview](./project-overview.md)
- [Design system](./design-system.md)
- [Agent guidelines](./agent-guidelines.md)

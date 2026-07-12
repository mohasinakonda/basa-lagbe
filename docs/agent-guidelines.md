# Agent Guidelines

Instructions for AI coding agents (Cursor and similar) working in the **Basa Lagbe** repository.

Runtime Cursor rules in `.cursor/rules/` and `.cursorrc` remain authoritative when they conflict with this doc. This file is the human-readable companion for agents and contributors.

---

## Persona and stack

Act as a **Senior Frontend Engineer** building scalable, accessible, high-performance apps with:

- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS

Also respect the project’s real integrations: Supabase, ImageKit, Google Maps, Twilio Verify. See [project overview](./project-overview.md).

---

## Scope discipline

- Change **only** what the task needs.
- No drive-by refactors, unrelated file edits, or opportunistic cleanup.
- Do not add markdown/docs unless the user explicitly asked for documentation.
- Match surrounding style (imports, quotes, naming, component patterns).

---

## Extend, don’t duplicate

Before adding new utilities or UI:

1. Check `lib/` for existing helpers (mappers, geo, auth, ImageKit upload, env, `cn()`).
2. Check `components/UI/` for primitives (input, label, dropdown, tooltip, carousel, etc.).
3. Extend or compose existing pieces rather than copying logic into a parallel implementation.

---

## Where to put things

| Need | Location |
|------|----------|
| Page / route UI | `app/...` |
| Server Actions (mutations) | `app/actions/` |
| HTTP API routes | `app/api/` |
| Feature UI | `components/<feature>/` |
| Shared primitives | `components/UI/` |
| Domain logic, clients, mappers | `lib/` |
| Client data hooks | `lib/hooks/` (prefer over empty root `hooks/`) |
| Shared types | `types/` |
| DB schema changes | `supabase/migrations/` |

---

## Server / client boundaries

- Default to **Server Components**.
- Add `'use client'` only for hooks, browser APIs, or event-driven UI.
- Never import server-only modules (service role Supabase, private keys, Twilio secrets) into client components.
- Prefer Server Actions for UI-triggered create/update/delete.
- Use client hooks only when fetching must happen on the client.

---

## Output quality bar

- Production-ready code — no pseudo-code, TODOs-as-implementation, or stub handlers.
- Include all required imports and dependencies.
- Prefer complete, runnable changes over partial snippets.
- Type props and public APIs explicitly; avoid `any` and silencing casts.
- For user-facing async flows, include loading, empty, and error states.
- Preserve accessibility (semantic HTML, keyboard access, labels, focus).

---

## Error handling

- Avoid empty or decorative `try/catch`.
- Handle errors in a way that surfaces useful feedback, or let them propagate when that is the existing pattern.
- Do not swallow failures silently.

---

## Performance checklist for agents

- Prefer server-rendered data for list/detail pages when possible.
- Do not add `useMemo` / `useCallback` by default — only when justified.
- Dynamic-import heavy client islands (maps, large pickers) when that matches existing patterns.
- Keep state colocated; lift only when multiple children need it.

---

## Coding standards reference

Follow [coding guidelines](./coding-guidelines.md) for naming, TypeScript, Tailwind, and a11y details. Follow [design system](./design-system.md) for color, typography, radius, and elevation tokens.

---

## Quick do / don’t

**Do**

- Read nearby files before editing.
- Reuse `@/` imports and existing design tokens.
- Keep PRs/changes focused and reviewable.

**Don’t**

- Invent a second UI kit next to `components/UI/`.
- Pull Supabase service-role or private ImageKit/Twilio keys into the client.
- Rewrite working code for stylistic preference without a task asking for it.

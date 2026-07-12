# Design System

Prefer semantic token classes (`bg-surface`, `text-muted-foreground`) over raw hex values.

---

## Brand direction

- Warm neutral page canvas with white (light) / near-black (dark) surfaces
- Primary accent: **rose / coral** for CTAs, selection, and focus emphasis
- Soft layered card shadows; rounded listing cards (`rounded-2xl`) and compact controls (`rounded-md` / `rounded-full`)
- Clean marketplace UI — not purple gradients, not heavy glow effects

---

## Color

Tokens are defined on `:root` and remapped for `prefers-color-scheme: dark`. Tailwind v4 exposes them via `@theme inline` as `--color-*`.

### Semantic tokens

| Token                  | Light       | Dark        | Typical Tailwind classes                         |
| ---------------------- | ----------- | ----------- | ------------------------------------------------ |
| `--background`         | `#f7f7f7`   | `#121212`   | `bg-background`                                  |
| `--foreground`         | `#222222`   | `#f7f7f7`   | `text-foreground`                                |
| `--surface`            | `#ffffff`   | `#1a1a1a`   | `bg-surface` (cards, header, dialogs)            |
| `--muted`              | `#f0f0f0`   | `#262626`   | `bg-muted`, `bg-muted/40`                        |
| `--muted-foreground`   | `#717171`   | `#a3a3a3`   | `text-muted-foreground`                          |
| `--border`             | `#dddddd`   | `#3f3f3f`   | `border-border`                                  |
| `--primary`            | `#e11d48`   | `#f43f5e`   | `bg-primary`, `text-primary`, `border-primary/*` |
| `--primary-foreground` | `#ffffff`   | `#ffffff`   | `text-primary-foreground`                        |
| `--ring`               | `#e11d4859` | `#f43f5e66` | `ring-ring`, `focus:ring-ring`                   |

### Usage guidance

- **Page canvas**: `bg-background` + `text-foreground` (see root `body` in layout)
- **Elevated panels**: `bg-surface` + `border-border` (header bars, sidebars, cards, sheets)
- **Secondary / helper text**: `text-muted-foreground` (`text-xs` / `text-sm`)
- **Primary actions**: `bg-primary text-primary-foreground`; hover often `hover:brightness-105`
- **Selection / active listing**: `border-primary/45 ring-2 ring-primary/25`
- **Focus**: `focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-ring`
- Prefer `color-mix` with `--primary` for tints (see admin day-picker styles) instead of hard-coded rose hex

Do **not** introduce one-off brand colors unless adding a new semantic token in `globals.css` and wiring it through `@theme inline`.

---

## Typography

### Fonts

| Role      | Family                               | CSS variable        | Tailwind    |
| --------- | ------------------------------------ | ------------------- | ----------- |
| UI / body | Geist (Google Fonts via `next/font`) | `--font-geist-sans` | `font-sans` |
| Mono      | Geist Mono                           | `--font-geist-mono` | `font-mono` |

Body stack fallback: `ui-sans-serif, system-ui, sans-serif`. Root layout applies `font-sans … antialiased`.

### Scale patterns in use

There is no separate type scale file — components use Tailwind text utilities consistently:

| Role                  | Common classes                                                |
| --------------------- | ------------------------------------------------------------- |
| Page / section titles | `text-lg`–`text-2xl`, `font-semibold` / `font-bold` as needed |
| Card titles           | `text-sm`–`text-base`, `font-semibold`                        |
| Body / form controls  | `text-sm`                                                     |
| Meta / captions       | `text-xs text-muted-foreground`                               |
| Primary CTA label     | `text-sm font-semibold`                                       |
| Price emphasis        | larger weight on amount; `/mo` often `text-muted-foreground`  |

Keep heading hierarchy semantic (`h1` → `h6`) even when visual size is adjusted with utilities.

---

## Radius

| Token                          | Value      | Common use                                  |
| ------------------------------ | ---------- | ------------------------------------------- |
| `--radius-sm`                  | `0.375rem` | Small chips / tight controls                |
| `--radius-md`                  | `0.5rem`   | Inputs, primary buttons (`rounded-md`)      |
| `--radius-lg`                  | `0.75rem`  | Larger controls                             |
| `--radius-xl` / `--radius-2xl` | `1rem`     | Cards, sheets, empty states (`rounded-2xl`) |

Also common: `rounded-full` for icon buttons, search fields, and filter pills.

---

## Elevation (shadows)

| Token                       | Tailwind            | Use                              |
| --------------------------- | ------------------- | -------------------------------- |
| `--shadow-card-layer`       | `shadow-card`       | Default listing / surface cards  |
| `--shadow-card-hover-layer` | `shadow-card-hover` | Card hover (`transition-shadow`) |
| `--shadow-dialog-layer`     | `shadow-dialog`     | Sidebars, modals, sheets         |

Light mode uses soft dual-layer shadows; dark mode uses deeper, higher-opacity shadows. Prefer these tokens over ad-hoc `shadow-*` stacks for cards and dialogs.

---

## Spacing and layout patterns

- Compact chrome: header/filter bars often `px-3 py-2.5`, `gap-2`
- Card content: `px-4` with footer meta `border-t border-border`
- Forms: labels `text-xs font-medium text-muted-foreground`; fields full width with `px-3 py-2`
- Overlays: backdrop often `bg-black/45` + light blur on sheets/dialogs
- Mobile-first sheets: bottom sheet on small screens; centered dialog on `md+` (see filters sheet)

---

## Components and primitives

Reusable building blocks live under `components/UI/`. Prefer them over new one-off form controls.

Typical control recipe (matches `Input`):

```txt
rounded-md border border-border bg-background px-3 py-2 text-sm
text-foreground shadow-sm placeholder:text-muted-foreground
focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-ring
```

Typical primary button recipe:

```txt
rounded-md bg-primary px-4 py-2.5 text-sm font-semibold
text-primary-foreground transition hover:brightness-105 disabled:opacity-50
```

Listing cards: `rounded-2xl border bg-surface shadow-card hover:shadow-card-hover`.

Icons: **Lucide React**. Icon buttons often `rounded-full p-2` with `hover:bg-muted`.

Class merging: use `cn()` from `lib/tailwind-merge.ts` when composing conditional classes.

---

## Dark mode

Dark tokens activate via `@media (prefers-color-scheme: dark)` — there is no separate theme toggle in the design tokens today. Components should use semantic colors so they adapt automatically.

---

## Accessibility (visual)

- Maintain contrast between `foreground` / `muted-foreground` and surfaces
- Always show focus rings (`ring-ring`) on interactive controls
- Do not rely on primary color alone for meaning (pair with text/icon state)
- Interactive elements must remain keyboard-accessible (see [coding guidelines](./coding-guidelines.md))

---

## Extending the system

1. Add or adjust CSS variables under `:root` (and the dark media query if needed) in `globals.css`
2. Expose them in `@theme inline` as `--color-*`, `--radius-*`, `--shadow-*`, or font tokens
3. Use the new Tailwind utility names in components
4. Document the token in this file

---

## Related docs

- [Project overview](./project-overview.md)
- [Coding guidelines](./coding-guidelines.md)
- [Agent guidelines](./agent-guidelines.md)

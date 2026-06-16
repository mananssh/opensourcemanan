# ADR 0010 — Per-vertical theming

**Status:** Accepted · 2026-06-16

## Context

Each vertical (the main Editorial site, the blog, later projects) should be able
to look completely different — its own palette and type — while still honoring
the mandatory light/dark toggle (ADR 0005) and reusing shared components. We
didn't want a parallel set of utility classes per vertical.

## Decision

**Scope the design tokens, keep the semantic names.** A vertical wraps its
subtree in a class (e.g. `.vertical-blog`) that redefines the token *values* for
both themes; the Tailwind utilities (`bg-paper`, `text-ink`, `font-display`, …)
are unchanged and simply render the scoped values.

- Colors were already CSS-variable tokens. Font families are now tokenized the
  same way: `--display-family` / `--body-family` / `--mono-family` at `:root`
  (Editorial), with `@theme` mapping `--font-display` → `var(--display-family)`
  etc. A vertical overrides the family vars and loads its own `next/font` fonts
  in its layout.
- Both themes are defined per vertical: `.vertical-blog { … }` for light and
  `html.dark .vertical-blog { … }` for dark.
- The blog is the first user: "Kinetic Mono" (Archivo / Hanken Grotesk /
  JetBrains Mono; high-contrast + hot vermilion accent), in `app/blog/layout.tsx`.

Chrome is also per-vertical: the Editorial header/footer moved into an
`app/(site)` route group (URLs unchanged); the root layout holds only the theme
provider; `/blog` has its own layout/header.

## Consequences

- A new vertical = one wrapper class with both-theme token values + a layout that
  loads its fonts. No new utilities, no forked components; `ThemeToggle` and the
  toggle work everywhere.
- Shared semantic classes mean a component dropped into any vertical adopts that
  vertical's look automatically.

# ADR 0005 — Every feature must support light and dark

**Status:** Accepted · 2026-06-15

## Context

OSM is a long-lived personal site that will accumulate many features. A theme
toggle bolted onto one page, with other pages stuck in a single mode, reads as
broken. We want theming to be a guarantee, not a per-feature afterthought.

## Decision

**Light and dark are both mandatory for every feature with a UI.** A single-mode
feature is never "done" (enforced via the Definition of Done checklist).

- The toggle is a **global primitive**: `next-themes` provider in the root
  layout + `components/theme-toggle.tsx` in the header. Features inherit it; they
  never build their own toggle.
- Theme is class-based (`.dark` on `<html>`), wired to Tailwind via
  `@custom-variant dark` in `app/globals.css`. `next-themes` sets the class
  before paint, so there is no flash and no hydration mismatch.
- Colors are **semantic design tokens** (`--paper`, `--ink`, `--muted`,
  `--rule`, `--accent`, …) defined for **both** `:root` and `.dark`, exposed to
  Tailwind as `bg-paper`, `text-ink`, etc. Features reference tokens, never raw
  hexes that only work in one mode.
- A feature **may** introduce its own palette (different features can look
  different), but it must define that palette for **both** themes.

## Consequences

- One dependency (`next-themes`, ~small) owns persistence + system detection +
  no-flash. Worth it for a guarantee used everywhere.
- New shared tokens live in `globals.css`; per-feature tokens follow the same
  both-modes rule.
- Reviewers and the DoD check both themes before merge.

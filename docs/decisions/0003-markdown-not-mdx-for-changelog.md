# ADR 0003 — Markdown (not MDX) for the changelog page

**Status:** Accepted · 2026-06-15

## Context

The public `/changelog` page renders our changelog as a polished artifact (à la
Vercel's changelog). The obvious question was whether to use **MDX** (Markdown +
embedded JSX) like many docs sites, or plain **Markdown**.

## Decision

Render the changelog as **plain Markdown**, not MDX.

The changelog is **auto-generated**: `.changeset/*.md` → `CHANGELOG.md` via
`scripts/compile-changelog.mjs`. There is no human authoring JSX into changelog
prose, so MDX's defining feature (interactive components inside content) buys us
nothing here and would fight the generation pipeline.

Implementation:

- `lib/changelog.ts` parses the compiled `CHANGELOG.md` into structured entries
  (date → entries with time/hash/type/summary/body) — the changelog **store**,
  reusable by a future API/RSS feed.
- `app/changelog/page.tsx` renders those entries server-side, with entry bodies
  rendered through `react-markdown` + `remark-gfm`.

This keeps a single source of truth (changesets) and stays DRY: the page is the
Rendering axis over data that already exists.

## Consequences

- No MDX toolchain, no `@next/mdx`, no extra build config for the changelog.
- **MDX is still the right tool later** for *hand-authored* content (a blog or
  docs where you want components in prose). We will adopt `@next/mdx` (or a
  content pipeline) when that feature lands — this ADR does not preclude it.
- The parser in `lib/changelog.ts` is coupled to the line format emitted by
  `scripts/compile-changelog.mjs`; both files note this. If the generator's
  output changes, the parser must change with it.

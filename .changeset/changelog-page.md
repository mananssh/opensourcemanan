---
type: feat
summary: Add a public /changelog page rendered from the changeset system
---

The changelog is now a public artifact at `/changelog`, rendered as a
polished, Vercel-style page. It's built as a system, not static content:
`lib/changelog.ts` parses the compiled `CHANGELOG.md` into structured
entries (the changelog store), and `app/changelog/page.tsx` renders them
server-side with per-type badges, commit hashes, and Markdown bodies.
Source of truth stays the changeset pipeline — no duplication. Also adds a
config-driven site header (`lib/site-nav.ts`) so new sections become
reachable by editing a list. Markdown (not MDX) per ADR 0003.

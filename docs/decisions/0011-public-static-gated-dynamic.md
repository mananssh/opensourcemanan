# ADR 0011 — Public posts render static/ISR; gated posts render dynamic

**Status:** Accepted · 2026-06-16

## Context

Blog post pages compiled MDX and ran Shiki highlighting on every request because
the page read the session (`auth()`) for visibility — forcing the whole route
dynamic (DA #3). For public posts that work is identical for every visitor, so
recomputing per request is wasted CPU and latency.

## Decision

Split the post route by access without splitting the URL:

- `generateStaticParams()` returns **public, published** slugs (via a
  session-less query) → those pages **prerender at build** and refresh on an
  hourly `revalidate` (ISR). MDX/Shiki runs once per revalidation, not per
  request.
- The page first calls **`getPublicPost(slug)`**, which reads **no session** — so
  the public branch contains no dynamic API and stays static.
- Only if that returns null (gated or missing) does it call the session-aware
  **`getPostAccess(slug)`** (`auth()`), which makes *that* render dynamic and
  handles sign-in redirect / 404. Gated slugs aren't in `generateStaticParams`,
  so they're rendered on-demand.

Net: public posts are cached static HTML; gated posts stay correct and dynamic;
one route, no duplication.

## Consequences

- New posts/edits appear within the revalidate window (1h) or on the next
  deploy; acceptable for a blog. Gated posts are always fresh.
- `getPublicPost` must never read the session (keeps the static branch static).
- At build with no `DATABASE_URL` (CI), `generateStaticParams` returns `[]` and
  everything renders on-demand — the prod build (with DB) prerenders the public
  set.
- The listing/category pages remain dynamic (cheap — no MDX compile); only post
  pages needed this treatment.

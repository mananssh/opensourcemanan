---
type: feat
summary: Blog Phase 1 — Kinetic Mono theme, posts/categories, public reading, SEO
---

The blog at /blog, built as the first content system on the shared primitives.

- Per-vertical theming (ADR 0010): font tokens generalized; a .vertical-blog
  scope gives the blog its own "Kinetic Mono" look (Archivo / Hanken Grotesk /
  JetBrains Mono, high-contrast + hot vermilion accent), light and dark. Editorial
  pages moved into an (site) route group with their own chrome; /blog has its own.
- First real DB tables: posts + categories (visibility enum) and migration.
- Visibility layer (public/authed/allowlist/owner, most-restrictive) enforced
  server-side in the store; gated rows never reach the client or sitemap/RSS.
- MDX posts via next-mdx-remote/rsc with code highlighting (Shiki, dual theme),
  auto heading anchors + table of contents, and reading-time.
- Listing, post detail, and category landing pages (category description hero).
- Core SEO: per-post metadata, JSON-LD, sitemap, robots, RSS feed. /blog in nav.

Authoring (admin) comes in Phase 2; pages render a graceful empty state until
there are posts.

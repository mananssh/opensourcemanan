---
type: feat
summary: Blog discovery — tags, search, and related posts
---

Phase 3 of the blog.

- Tags: tags + post_tags (m2m) tables and migration; edit tags (comma-separated)
  in the post admin (upserted + linked on save); tag chips on posts; tag landing
  pages at /blog/tag/[slug].
- Search: full-text-ish search over title/excerpt/body of visible posts, at
  /blog/search (with a search box on the blog index). Visibility-filtered.
- Related posts: each post shows up to 3 related (same category or shared tag),
  visibility-filtered.

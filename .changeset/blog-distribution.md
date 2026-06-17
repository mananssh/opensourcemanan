---
type: feat
summary: Blog distribution — dynamic OG images + newsletter capture
---

Phase 5 of the blog.

- Dynamic per-post Open Graph images via next/og (1200x630, branded with the
  post title + category); auto-wired into each post's metadata. Session-less,
  effectively-public posts only.
- Newsletter capture: an email signup form on the blog index (subscribe server
  action + useActionState client form), storing addresses in a subscribers
  table (provider integration deferred). Admin shows the subscriber count.

---
type: feat
summary: Blog engagement — reactions, comments, and view counts
---

Phase 4 of the blog.

- Reactions: one like per signed-in user per post (toggle); count shown on the
  post. Clicking while signed out redirects to sign-in.
- Comments: signed-in users post plaintext comments (shown immediately); the
  owner moderates (deletes) from the admin dashboard. Anonymous visitors see a
  sign-in prompt.
- View counts: a per-post counter incremented once per browser session via a
  fire-and-forget beacon; shown in the post meta.

Adds reactions/comments/post_views tables (migration) + a shared safe-db read
helper (DRY).

---
type: feat
summary: Blog engagement — optimistic reactions, threaded/moderated/rate-limited comments, bookmarks
---

Addresses the blog audit (§6, excluding telemetry/newsletter):
- Reactions now update optimistically (instant heart + count) via useOptimistic.
- Comments: one level of threaded replies, a per-user rate limit (5/min), and an
  inline error channel; owner moderation (hide/show) from the admin dashboard
  with a "hidden" badge — hidden comments drop from the public thread. The admin
  comment list is the in-app notification surface (email notify needs a provider,
  which is out of scope here).
- Bookmarks: signed-in readers can save posts (optimistic Save button) and view
  them at /blog/bookmarks ("Saved" in the blog header).

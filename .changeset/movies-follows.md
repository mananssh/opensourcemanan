---
type: feat
summary: Reel Phase 2 — follow friends by @handle + a friends strip on the dashboard
---

Reel gains a follow graph — the second phase of the movie/TV tracker. It stays
deliberately un-social: there is no discovery feed and no algorithm. The only
way a friend's activity reaches you is to know their exact `@handle`, open their
reel, and follow them.

- **Follow graph** — a new `follows` table (directed `follower → followee` edge,
  composite PK so a follow is idempotent). Server actions `follow(handle)` /
  `unfollow(handle)`, both exact-match only, guarded by `requireViewer()`.
- **Profile follow button + counts** — public profiles show a follow/unfollow
  toggle (optimistic) and follower/following counts. Hidden on your own profile
  and for signed-out visitors.
- **Dashboard friends strip** — the people you follow as avatar chips, plus a
  reverse-chronological rail of their most recent watches (no ranking). A
  "find a friend by @handle" box jumps straight to a reel.

Reuses the existing query conventions (`safeDb`, `cache()`, row→card mappers)
and the per-vertical token theme; no new infrastructure.

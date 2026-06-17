---
type: feat
summary: Blog data model & scale — indexes, scheduled publish, soft delete, featured, pagination
---

Addresses the blog audit (§5):
- Indexes on posts(status, publishedAt), posts(categoryId), comments(postId,
  createdAt) so listings are index-backed, not full scans.
- Scheduled publishing: a future publishedAt with status published keeps a post
  hidden until its time (a single livePost() predicate enforces published +
  not-deleted + publishedAt <= now across every visitor query, detail access,
  feeds, sitemap and view counting).
- Soft delete: deleting a post sets deletedAt (recoverable; comments/reactions/
  views and the cover image are kept) and it drops out of every list.
- Featured posts: a flag + a "Featured" strip on the blog index.
- Editor gains a publish-date (datetime-local) field and a Featured checkbox.
- Search escapes LIKE wildcards (% and _ matched literally).
- Blog index is paginated.

---
type: fix
summary: Harden blog security & data integrity (view endpoint, slugs, transactions, uploads)
---

Closes the edge-case risks from the blog audit (§1):
- View endpoint now validates a well-formed UUID maps to a published post and
  de-dupes per browser via a daily cookie — no more counting drafts or inflating
  via arbitrary IDs.
- Duplicate slugs no longer crash the save: auto-derived slugs disambiguate
  (-2, -3…), explicitly-typed collisions return an inline error via a new
  action-state channel on the post/category forms (plus an unsaved-changes guard).
- Post write + tag rewrite run in one transaction; cover-image publish failures
  abort the save instead of saving a broken reference.
- safeDb only swallows true pre-setup errors (SQLSTATE 42P01 / missing
  DATABASE_URL), not any "does not exist" message.
- Admin reads each call requireOwner() (guard co-located with the data, not just
  the layout).
- Upload hardening: image-type allowlist (SVG blocked), 10 MB client cap, 5-min
  presign expiry, make-public validates the key prefix. Orphaned GCS objects are
  deleted on cover replace and on post/category delete. Inline category create no
  longer silently renames an existing category.

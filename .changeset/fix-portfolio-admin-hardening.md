---
type: fix
summary: Close storage and validation gaps in the portfolio admin CMS
---

The résumé field was documented and typed as a GCS object key but was
actually entered as a raw URL, since the upload endpoint only allowed image
MIME types — the one place in the portfolio that broke the "store a key,
never a URL" storage convention. Résumés now upload as a real PDF through the
same presigned-upload flow as images.

Also: a hackathon's "related project" was a free-text field with no
validation, so a typo or a later project rename/delete silently produced a
dead link — it's now a `<select>` of real projects, validated server-side
too. `saveProfile` gained the same required-field check its sibling actions
already had. Every admin save/delete action now handles a DB failure the
same way (an inline error instead of crashing past the form into Next's
default error page), and the upload widgets now delete a replaced or
removed-before-save file instead of leaving it orphaned in the bucket.

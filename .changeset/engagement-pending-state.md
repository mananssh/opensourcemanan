---
type: fix
summary: Loading/pending state on all server-action buttons + comment delete
---

Every button that runs a server action (reactions, post comment, admin save/
delete/publish, comment moderation, sign in/out) now disables itself and shows
a loading label while submitting (via a shared useFormStatus SubmitButton) — so
there's clear feedback and rapid multi-clicks can no longer fire duplicate
submissions (the cause of duplicate comments). Also: comment authors can delete
their own comments, and the owner can delete any. Admin Save/Delete are split
into separate forms so each shows an accurate pending state.

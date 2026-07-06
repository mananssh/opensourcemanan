---
type: fix
summary: Harden Sully's rate limiting, stream handling, and IP privacy
---

The public `/api/fit` route's abuse guard only recorded a run when the stream
finished, so concurrent or rapid-fire requests could all read the same
pre-increment count and blow past both the per-IP and global daily caps.
`checkAndReserve` now checks the caps and inserts the run row in one
transaction, closing the race, and `finishRun` updates that same row instead
of writing a second one.

Also fixes: an enqueue-after-close bug in the stream handler if logging the
run outcome failed after the controller closed; the rate limiter's claimed
"fails open on any DB error" behavior, which previously only held for a
narrow set of pre-migration errors; and a hardcoded IP-hashing salt fallback
(a known constant in this public repo) that silently degraded the
never-store-a-raw-IP guarantee — it now falls back to a random per-boot salt
with a startup warning.

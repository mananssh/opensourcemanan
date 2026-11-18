---
type: chore
summary: Geetdle — de-duplicate the song catalog (one row per recording)
---

JioSaavn re-lists the same recording under dozens of "playlist" albums (`Best of
2025`, `Valentines Special`, `Arijit Singh Drive Mix`, …), each a separate row
with its own id, a compilation name in `movie` and a fresh `year` stamp. The
seed's old `title|year|movie` de-dupe couldn't catch them because movie and year
differ on every copy, so the catalog carried ~1,300 duplicates.

A shared, pure de-dupe (`scripts/lib/geetdle-dedupe.mjs`) now collapses songs by
title + singer-set (order-independent, with the `(From "Movie")` suffix
stripped), keeping the ORIGINAL — the oldest release, tie-broken toward a real
soundtrack over a compilation. The seed pipeline uses it so duplicates can't
return, and a new `scripts/prune-geetdle-dupes.mjs` (dry-run by default,
`--apply` to delete) pruned the live catalog from 5,924 to 4,626 rows. The
answer-eligible pool stays large (3,069 songs). No gameplay or UI change.

---
type: fix
summary: Fix orphaned sticky-note tape in the masonry wall
---

The note "tape" was a ::before pseudo-element, which Chrome mis-paints/orphans
inside CSS multi-column layouts (a stray tape appeared in a column gap). It's now
a real child element bound to each card, so the tape only ever sits on its note.

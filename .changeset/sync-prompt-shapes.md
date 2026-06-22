---
type: fix
summary: Make prompts the single source of truth for agent output shape
---

The prompts now each declare their own `Return: {…}` spec, but the code was also
appending its own (sometimes conflicting) JSON shape via `withJsonTail`. Removed
the duplication so the prompt owns the shape:

- `withJsonTail` appends only the reason-then-JSON protocol (points at the prompt's
  own Return spec); the hardcoded per-node shapes are gone.
- `compose` now returns the paragraph as plain text (matching the prompt's "output
  nothing else"); the displayed evidence is the gather-curated set (deduped, capped)
  rather than a separate `citedHrefs` round-trip.
- `web_corpus` reads the prompt's `note` field for the company-alignment line.
- Public fallback prompts carry `Return:` specs too, so the OSS build still works.

Verified live: all six JSON nodes parse, compose is clean plain text, evidence is
grounded.

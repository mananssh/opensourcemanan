---
type: feat
summary: Add the /osm manifesto page
---

A single public page at /osm describing what OSM is, in a few punchy words.
Heightens the Editorial Logbook system (no divergence): oversized Fraunces
hero with a pulsing accent, a ghosted OSM watermark for depth, a mono ethos
strip, and a printed-style colophon. Staggered CSS-only reveal on load
(respects prefers-reduced-motion), light + dark via tokens (ADR 0005), design
reviewed first (ADR 0006). Reusable `.reveal`/`.accent-pulse` motion primitives
added to the design system; reachable via a config-driven "About" nav entry.

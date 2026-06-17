---
type: feat
summary: Wider category art, shared vertical footer, changelog activity charts
---

Three UI touches:
- Blog category tiles: the corner cover image is wider so the tile reads less
  empty, keeping its vertical position.
- New shared `VerticalFooter` — every vertical (currently /blog) gets quiet
  "← OSM" and "Changelog" links back to the common union, themed per vertical
  via semantic tokens. Verticals stay visually independent; only the home/log
  links are shared.
- Changelog gains a minimal activity panel above the log: a per-day commit
  time-axis and a type-distribution bar, both hand-rolled from the existing
  type palette and design tokens (no charting lib). Type vocabulary synced to
  the commit taxonomy (adds style/build/ops; keeps ci for historical entries).

---
type: feat
summary: /osm shows the index + a changelog link; pointer cursor on all controls
---

- The /osm page swaps its colophon for the editorial Index (links into Blog,
  Changelog, Thought Dump — excludes Home and /osm itself).
- The ethos strip drops "DRY or don't" and "Light & dark, always"; keeps
  "Systems, not pages" and "Open by default", and the third is now a "View the
  changelog →" link.
- Global: restore `cursor: pointer` on buttons/[role=button]/summary (Tailwind
  v4 preflight had dropped it), so every clickable shows the right cursor.

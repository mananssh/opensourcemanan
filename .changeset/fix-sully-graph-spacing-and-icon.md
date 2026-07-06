---
type: fix
summary: Fix the Sully graph's critique→compose overlap and add its real icon
---

In the live agent graph, `critique` and `compose` sat exactly one node-width
apart, leaving zero room for the connector between them (every other
transition has 6–18 units of gap). `compose` is now spaced consistently with
the rest of the flow. The Sully avatar also went from a placeholder "S"
badge to the real mark (`public/sully.svg`), recolored to the theme's
emerald identity via a CSS mask.

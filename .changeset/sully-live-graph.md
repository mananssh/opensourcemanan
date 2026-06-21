---
type: feat
summary: The live Sully graph — animated node-graph + streamed thinking (Phase 2, PR2)
---

The centerpiece visualization. Replaces the thin PR1 graph with the full §10
experience inside the neon-dark Sully stage:

- `agent-graph.tsx` — rounded-rect nodes with arrowheaded hairline edges that draw
  on in the accent as each is taken; node states driven purely by the event
  stream (running = breathing pulse + dot, done = settle to hairline + check,
  skipped = dashed/dimmed, error = negative). The parallel band lights together
  and finishes independently; the critique loop draws its dashed re-gather edge
  back with a "↻ pass 2" counter; the decline short-circuit dims the middle and
  jumps gate → compose. Horizontal on desktop, vertical on mobile.
- `thinking-stream.tsx` — the live reasoning panel: the running node's streamed
  text shows in full, completed nodes collapse to a one-line summary you can
  re-expand. Auto-scrolls to the active node but yields when the reader scrolls
  up. ARIA-live (polite).
- `sully-panel.tsx` — the running view becomes two regions (graph ~40% / thinking
  ~60%, stacked on mobile); reasoning deltas are throttled to ~one flush per
  animation frame so streaming is smooth; a "run another" affordance appears with
  the result.
- Reduced-motion drops the pulses and edge-draws for clean instant state changes;
  the labeled example replay now showcases the parallel band.

No new dependencies; no Phase 1 design regressions.

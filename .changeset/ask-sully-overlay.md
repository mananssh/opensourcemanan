---
type: feat
summary: Ask Sully — a portfolio-wide AI chat overlay, scoped to Manan
---

A floating "Ask Sully" trigger on every portfolio page opens a Gemini-style
bottom-sheet chat overlay (the live page stays visible, blurred, above it), and
selecting any text surfaces an "Ask Sully" popup that pre-fills the same panel.
Answers are grounded strictly in Manan's live, DB-backed portfolio corpus —
judgment/fit questions get a confident opinion, on-screen content is explained
from a viewport-aware page snapshot, and anything genuinely off-topic is
declined without leaking outside facts.

The feature composes existing machinery rather than duplicating it. The
model-router, event bus, and rate-limiter were generalized (not forked) so both
the fit agent and this chat share one implementation; a single scoped
`streamChat` per turn (no LangGraph) keeps it cheap. A new `ask_runs` table
provides its own rate-limit bookkeeping.

Also hardens the shared agent infrastructure surfaced while building this:

- Prompts now load from a private GCS object (`AGENT_PROMPTS_KEY`) with a TTL
  cache, falling back to `AGENT_PROMPTS_B64` then generic defaults — edit and
  re-upload (`npm run prompts:upload`) with no redeploy, and no 26KB env blob.
- Model-router: per-tier circuit breaker (a dead strong model no longer
  benches its healthy fast sibling), a longer idle timeout for slower strong
  models, env-configurable per-tier lane order, and per-lane failure logging.
- Fit-agent `plan`/`fit_gate` prompts now actually receive the seniority and
  hard-constraint signals the intake node was already extracting.

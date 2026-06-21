---
type: fix
summary: Harden Sully from a live acceptance pass — reliable, fast, and honest end-to-end
---

Ran the real agent against a genuine JD, a deliberate non-fit (sales), and a
prompt injection, and fixed what the run surfaced:

- **compose** now writes the actual recruiter-facing case (it previously emitted
  meta-commentary about its own draft) and never leaks a `citedHrefs` list into
  the paragraph.
- **Grounding/selection**: gather nodes dedupe repeated picks; the oversized
  corpus body text is trimmed so selection is fast and reliable (work-history
  evidence was being dropped).
- **Reliability**: an idle (stall) timeout that re-arms per byte, a per-lane
  circuit breaker so a stalling free tier is skipped instead of costing every
  node its timeout, failover on any HTTP error, and graceful degradation in
  every node (a model hiccup can no longer kill a run — it always produces a
  result). Strong tier defaults to non-thinking `gemini-2.0-flash` (its visible
  output can't be starved by hidden reasoning tokens), and selection/classification
  nodes use the fast model so failover stays inside the route's 60s budget.
- **Fit gate** now declines non-postings / prompt-injection / gibberish as
  `not_a_fit` (the injected text is analyzed as data, never obeyed).
- **Loop** is bounded to one extra re-gather and is skipped once the run has used
  most of its time budget; the critique only loops on a genuinely unsupported key
  requirement, so strong cases finish without needless passes.

Verified live: real JD → grounded "strong" with an honestly-named stretch; sales
role → graceful decline via the short-circuit; injection → declined.

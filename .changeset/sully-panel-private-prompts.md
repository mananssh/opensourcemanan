---
type: feat
summary: Sully panel polish + private env-loaded prompts + model/token telemetry
---

- **Private prompts (ADR 0015):** the agent's prompts move out of the repo.
  `lib/agent/prompts.ts` is now a loader that reads `AGENT_PROMPTS_B64` (base64 of
  the gitignored `agent.prompts.json`); the repo ships only generic fallbacks so
  the OSS build still runs. `npm run prompts:encode` regenerates the env value.
- **Smarter verdict:** the prompts now credit related/implied technologies as
  real evidence (Next.js ⇒ React; shipping JS/TS services ⇒ Node.js; FastAPI ⇒
  Python) instead of penalizing for an exact keyword's absence.
- **Model + tokens shown:** the router reports usage via a sink; the run emits a
  final `usage` event and the panel shows `model · tokens · model calls`.
- **Panel layout:** the live view is now vertically stacked — the graph on top
  (much larger, centered) with the thinking stream below a divider, instead of a
  cramped side-by-side split. Evidence is labelled explicitly ("Evidence — cited
  from his actual work") and rendered as bordered, hoverable chips.

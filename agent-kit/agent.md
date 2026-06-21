# Sully — the live fit agent

Sully is the portfolio's centerpiece: paste a role, a real multi-step
**LangGraph.js** agent runs server-side and streams its genuine execution back —
the graph lighting up node by node, the reasoning streaming live, a final
evidence-cited verdict. See [ADR 0014](../docs/decisions/0014-live-agent-streaming.md)
for the decisions and the build brief for the full intent.

## The one rule

**Never fake, pre-script, or time-animate a live trace.** Node states and
reasoning come only from a real run. The single allowed exception is the
**example replay** (`components/portfolio/agent/example-run.ts`), which is always
shown behind an explicit "example" label and never presented as live.

## The seam (unchanged from Phase 1)

`components/portfolio/agent/` is the client boundary and must stay free of
server/node code:

- `agent-types.ts` — `FitResult`/`Evidence`/`FitVerdict` (frozen) + the enriched
  `AgentEvent` union + `NODE_LABELS` + `AgentRestingError`.
- `run-fit-assessment.ts` — `POST /api/fit`, parse NDJSON, yield events, return
  the `FitResult`. Signature is frozen.
- `sully-panel.tsx` — drives the generator, reduces events into node state + a
  thinking stream. `agent-graph.tsx` — renders the graph from node state.

## The agent (`lib/agent/`, server-only)

```
intake → fit_gate ─(not_a_fit)──────────────► compose (decline)
              │ (strong / plausible)
              ▼
            plan ──► ┌ work_history ┐
                     ├ projects     ┤ (parallel) ─► synthesize ─► critique ─► compose
                     └ web_corpus   ┘                                │
                                         ▲──────── re-gather (≤2) ────┘
```

- `graph.ts` — the `StateGraph`. **Node names must not collide with state channel
  names** (LangGraph 1.x), so the `plan`/`critique` nodes write to
  `planDimensions`/`critiqueResult` (`state.ts`).
- `nodes.ts` — the nine nodes. Each emits `node_start` → streamed `node_reasoning`
  → `node_status` (tool actions) → `node_done`. Gather nodes degrade gracefully;
  `intake`/`fit_gate` degrade biased-yes to keep the demo alive; `synthesize`/
  `compose` are fatal if they fail.
- `events.ts` — the run-scoped bus (`emit`/`drain`) threaded via `configurable.ctx`.
- `model-router.ts` — OpenAI-compatible streaming + lane failover. Per-node tier
  via `TIER`. The `JSON_SENTINEL` splits visible reasoning from a structured tail.
- `corpus.ts` — the DB store → grounded evidence candidates (real `href`s).
- `tools/tavily.ts` — degrade-safe company research (cached in `agent_cache`).
- `rate-limit.ts` — per-IP + global daily caps + run logging on `agent_runs`
  (salted IP hash; never raw).
- `run.ts` — orchestrator: load corpus, invoke the graph, yield bus events,
  emit `result`.

## Adding / changing a node

1. Add the id to `NodeId` + `NODE_LABELS` in `agent-types.ts`.
2. Add a node in `nodes.ts` via `defineNode` (it auto-emits start/done/error).
3. Wire edges in `graph.ts` (keep node names ≠ channel names).
4. If it needs structured output, stream prose then a `withJsonTail(...)` JSON
   object and read it off `StreamResult.json`.
5. Update the client graph layout (`agent-graph.tsx`) and reducer if the node is
   user-visible.

## Config

All keys/knobs are server-only env vars — see `.env.example` (`GEMINI_API_KEY`
required for live runs; `NVIDIA_NIM_API_KEY` / `OPENCODE_ZEN_API_KEY` /
`TAVILY_API_KEY` optional; `AGENT_*` caps/timeouts).

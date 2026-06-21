---
type: feat
summary: Make Sully a real streaming LangGraph.js fit agent (Phase 2, PR1)
---

Replaces the stubbed agent behind Sully with a real multi-step LangGraph.js graph
that streams its genuine execution. `runFitAssessment` now calls a new streaming
route (`app/api/fit`) that runs the graph server-side and emits real `AgentEvent`s
as NDJSON; `FitResult` and the generator signature are unchanged.

- `lib/agent/` — typed `StateGraph` (intake → fit_gate → plan → parallel
  work_history ∥ projects ∥ web_corpus → synthesize → critique → compose) with a
  biased-yes, injection-safe fit gate, a decline short-circuit, and a bounded
  re-gather loop. Reasoning streams from inside each node via a run-scoped event
  bus — the trace is never faked.
- Model router over OpenAI-compatible lanes (Gemini Flash → NVIDIA NIM →
  OpenCode Zen) with per-node tiers and 429/5xx failover; keys are server-only.
- Evidence is grounded in the DB-backed portfolio corpus — every citation
  resolves to a real permalink. Tavily company research degrades to corpus-only
  if unavailable or rate-limited.
- `agent_runs` + `agent_cache` tables (migration 0009) give per-IP + global daily
  caps, telemetry, and Tavily caching on the shared DB — no new infra. IPs are
  stored only as a salted hash. Over the cap, the UI shows a clearly-labeled
  example replay.

PR1 ships the real agent behind a deliberately thin graph UI; the full live-graph
visualization lands in PR2. See ADR 0014 and `agent-kit/agent.md`.

# ADR 0014 — Sully goes live: a streaming LangGraph.js fit agent

**Status:** Accepted · 2026-06-21

## Context

Phase 1 shipped the portfolio with a reserved agent console (Sully) behind a
stubbed async generator, `runFitAssessment(input)`, that yielded a baked trace
and returned a baked `FitResult`. Phase 2 makes it real: a recruiter pastes a
role and a genuine multi-step agent runs **in front of them** — a graph whose
nodes light up as they execute, with each node's actual reasoning streaming live.

The hard rule for the feature: **never fake, pre-script, or time-animate the
trace.** Every node state and reasoning line must reflect what the agent actually
did on this request. A canned animation defeats the entire purpose.

## Decision

**1. Keep the Phase 1 seam; change only what's behind it.** `runFitAssessment`
keeps its signature and `FitResult`/`Evidence`/`FitVerdict` stay byte-for-byte
identical. The yielded event type is *enriched* from the placeholder `TraceEvent`
to a richer `AgentEvent` union (streamed reasoning + graph transitions). The body
now calls a streaming API route.

**2. Explicit event bus, not LangGraph stream-scraping.** A run-scoped bus
(`lib/agent/events.ts`) is threaded into every node via the graph's
`configurable`. Nodes `emit()` exactly what they did; the route drains the bus
into the response. We use LangGraph purely for real orchestration (conditional
decline, parallel fan-out, bounded loop) and own the event surface ourselves —
so honesty is by construction and we're decoupled from LangGraph's streaming API
churn.

**3. NDJSON over a Web `ReadableStream`, Node runtime.** `app/api/fit/route.ts`
is `runtime = "nodejs"`, `dynamic = "force-dynamic"`, `maxDuration = 60`. NDJSON
(one JSON object per line) is trivial to produce server-side and read with a
`fetch` + stream reader client-side. Keys never reach the client.

**4. OpenAI-compatible model router with failover.** `lib/agent/model-router.ts`
is a thin streaming client over OpenAI-compatible endpoints with per-node tiers
(cheap/fast for classification-shaped nodes, stronger for generative ones).
Lanes, in priority order: **Gemini Flash → NVIDIA NIM → OpenCode Zen**; it fails
over on a 429/5xx **before the first token** (once tokens flow we commit to a
lane so the visible thinking stays honest). Base URLs / model ids are env-
overridable because free rosters rotate (notably OpenCode Zen). Privacy: only the
JD flows through; NIM/OpenCode free tiers may log/train, so nothing sensitive is
routed.

**5. Corpus is the DB, not a static `profile.ts`.** `lib/agent/corpus.ts` reads
the existing portfolio store and shapes it into candidate evidence, each carrying
a permalink that resolves on the site (`/work/[slug]`, `/hackathons/[slug]`,
`/experience/[id]`, `#work`/`#experience`/`#hackathons`/`#capabilities`). Compose
may only cite from accumulated evidence — a hallucinated citation is impossible
by construction.

**6. Safety + quota on the shared DB (no new infra).** `agent_runs` is the
rate-limit source of truth (per-IP hourly window + global daily cap) and the
Telemetry-axis seam (verdict / duration / capped / error). IPs are stored only as
a salted hash. `agent_cache` is a small TTL store for Tavily company-research —
**only tool output is cached, never the trace or a full result.** Over the cap,
the route returns a calm 429 and the client shows a clearly-labeled example
replay (never passed off as live). The JD is treated as untrusted data, fenced so
it can never act as instructions; the fit gate is the injection checkpoint.

## Alternatives considered

- **Vercel AI SDK / `streamText`** — great for single-model token streams, but we
  need to stream graph transitions + per-node reasoning from a multi-node graph.
  Raw NDJSON + our own bus fits better.
- **Edge runtime** — better streaming limits, but LangGraph/Node ergonomics and
  failover are simpler on Node; `maxDuration` covers our run length.
- **Upstash/Vercel KV for rate limiting** — rejected; the shared CockroachDB
  already satisfies the four-axis Data seam ("add a feature = compose existing
  machinery, zero new infra").
- **Caching full results for identical inputs** — rejected; replaying a stored
  trace would mean faking the live thinking. We run live every time and protect
  quota with the daily cap + Tavily cache instead.

## Consequences

- The agent is a genuine, inspectable LangGraph run; the "wow" is authenticity.
- Live runs require at least `GEMINI_API_KEY`; with no key the section still
  renders and the labeled example replay works.
- PR1 ships the real agent end-to-end behind a deliberately thin graph UI; the
  full live-graph visualization (§10 of the build brief) lands in PR2, and
  caching polish + the formal acceptance pass (real JD · decline · injection) in
  PR3. See `agent-kit/agent.md`.

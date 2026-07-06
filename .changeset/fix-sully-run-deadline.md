---
type: fix
summary: Cap Sully's total model-call time so it degrades instead of timing out
---

`/api/fit` hit Vercel's hard 60s `maxDuration` kill in production — each of
the graph's 9 nodes could independently spend up to ~30s failing over across
model lanes (three lanes x a 10s idle-timeout), and the cumulative total
across nodes could exceed the route's budget. `model-router.ts` now takes a
run-wide `deadlineAt` (45s by default, `AGENT_RUN_DEADLINE_MS`): once it
passes, `streamChat` stops trying further lanes and aborts in-flight
requests, so every remaining node degrades near-instantly instead of the
whole route dying with an ungraceful connection drop. Also lowered the lane
circuit breaker's failure threshold from 2 to 1, so a bad lane stops being
retried across nodes sooner.

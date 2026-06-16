---
type: perf
summary: Cache MDX compilation so posts don't recompile Shiki per request
---

Properly resolve DA #3 without route-level static rendering (which 500'd gated
posts, ADR 0011). The post route stays dynamic for visibility gating, but the
expensive MDX compile (runs Shiki) is wrapped in unstable_cache keyed by the
source — identical content compiles once and is reused across requests; editing
a post changes the source and recompiles. Renders via @mdx-js/mdx compile/run,
keeping the body server-rendered RSC with MDX components intact (replaces
next-mdx-remote). See ADR 0012.

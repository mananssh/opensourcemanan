---
type: fix
summary: Fix 500 on gated blog posts (revert route-level static rendering)
---

Gated posts 500'd in production with DYNAMIC_SERVER_USAGE: route-level
`revalidate`/`generateStaticParams` put the post route in static mode, but the
gated path reads the session (cookies), which is disallowed during static
generation. Reverted the post route to fully dynamic so visibility gating works
again (public 200, gated → sign-in). The DA #3 perf goal will be met by caching
MDX compilation instead of route-level static rendering (ADR 0011 updated).

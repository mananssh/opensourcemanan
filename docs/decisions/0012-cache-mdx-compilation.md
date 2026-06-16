# ADR 0012 — Cache MDX compilation (the real fix for DA #3)

**Status:** Accepted · 2026-06-16

## Context

Blog post pages must read the session to enforce visibility, so the route is
dynamic — which meant MDX was compiled and Shiki ran on **every** request. ADR
0011's attempt to make public posts static/ISR conflicted with the per-session
cookie read and 500'd on gated posts; it was reverted. We still want to avoid
recompiling identical content on every request.

## Decision

Keep the post route **dynamic**, but **cache the expensive, session-independent
work**: compiling MDX (which runs Shiki). Implemented with `@mdx-js/mdx`:

- `compile(source, { outputFormat: "function-body", … remark/rehype incl. Shiki })`
  is wrapped in **`unstable_cache`**, keyed by the MDX `source`. Identical
  content compiles once and is reused across requests and serverless
  invocations; when a post is edited, the source changes, so the key changes and
  it recompiles.
- `run(compiledCode, { ...react/jsx-runtime })` evaluates the cached compiled
  module **per request** (cheap) and yields a server component, so the body stays
  **RSC + server-rendered** and MDX components (e.g. `<Callout>`) keep working.

Replaced `next-mdx-remote` with `@mdx-js/mdx` directly to get the
compile/run split.

## Why not the alternatives

- **Route-level static/ISR** (ADR 0011) — conflicts with the per-session cookie
  read; 500'd gated posts.
- **`cacheComponents` / `'use cache'`** — a site-wide caching mode switch that
  changes semantics for every route; too broad/risky for one optimization.
- **Cache compiled HTML string** — would drop MDX React components (the reason we
  chose MDX). The compile/run split keeps them.

## Consequences

- One compile per unique source, not per request. Gating stays correct and
  dynamic.
- `run` evaluates compiled code (AsyncFunction) — fine on the Node runtime
  (our routes); would not work on the Edge runtime.
- Cache entries are tagged `blog-mdx`; the admin can `revalidateTag("blog-mdx")`
  on edit if ever needed (source-keying already handles edits).

# ADR 0015 — Sully's prompts are private (env-loaded, repo ships fallbacks)

**Status:** Accepted · 2026-06-22

## Context

This is a public repo, but the agent's prompts are the owner's tuned IP — the
persona, the biased-yes gate nuance, the framework-equivalence reasoning, the
grounding discipline. Committing them (as Phase 2 PR1–PR3 did) puts them in
public git history forever.

## Decision

Prompt **mechanics** stay in code (untrusted-input fencing, the streamed-reasoning
→ JSON-tail protocol, the sentinel). Prompt **text** does not:

- `lib/agent/prompts.ts` is a loader. It reads `AGENT_PROMPTS_B64` — base64 of a
  JSON map of per-node templates with `{{placeholder}}` tokens — decodes/caches
  it, and exposes `getPrompt(key)` + `fill(template, vars)`.
- The repo ships only **generic, un-tuned fallbacks** so the open-source build
  runs end-to-end without the owner's prompts. Forks get a functional agent; the
  prompt engineering stays private.
- The real prompts live in a **gitignored `agent.prompts.json`**;
  `scripts/encode-prompts.mjs` (`npm run prompts:encode`) base64-encodes it into
  `.env`, and the same value goes into the Vercel project env. The value is never
  printed or committed.

History containing the old prompts is scrubbed separately (a one-time
`git filter-repo` redaction + force-push); going forward nothing prompt-related
is committed.

## Alternatives considered

- **Leave prompts in code** — simplest, but defeats the privacy goal on a public
  repo.
- **No fallbacks (require env)** — would break the OSS build and previews without
  the secret. The bland fallbacks keep the repo self-sufficient.
- **Encrypt instead of base64** — base64 isn't encryption, but the value lives
  only in `.env`/Vercel (never the repo), so obfuscation isn't the point; keeping
  it out of source is. Base64 is just a single-line transport for a multi-line
  JSON blob.

## Consequences

- The public repo never contains the tuned prompts (after the history scrub).
- Editing prompts is: edit `agent.prompts.json` → `npm run prompts:encode` →
  restart / redeploy. A teammate without the file still gets a working agent.
- The deployed site already never exposed prompts (server-only); this closes the
  git-history vector too.

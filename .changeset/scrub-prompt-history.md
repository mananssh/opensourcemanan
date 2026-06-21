---
type: ops
summary: Scrub the old (pre-env) agent prompts from git history
---

Rewrote history to drop `lib/agent/prompts.ts` and `lib/agent/nodes.ts` from all
prior commits (they carried the tuned prompt text before ADR 0015 moved prompts
to `AGENT_PROMPTS_B64`), then re-added their current env-loader versions. The
prompts are no longer recoverable from the public history.

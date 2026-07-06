---
type: docs
summary: Rewrite the boilerplate README and fix Sully doc/code drift
---

`README.md` was still the default `create-next-app` template. It now
describes the actual project and points to `agent-kit/` for contribution
conventions. `agent-kit/agent.md` claimed `synthesize`/`compose` were
"fatal if they fail," but both nodes always degrade gracefully in code
(a deliberate hardening) — the doc now matches. A graph-diagram comment also
said the bounded re-gather loop allows up to 2 extra passes; the code only
ever allows 1.

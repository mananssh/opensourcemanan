<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## How we build here — read `agent-kit/` first

Before doing any work in this repo, read [`agent-kit/`](agent-kit/) — the single source of truth for conventions, workflow, and safety. Start with [`agent-kit/README.md`](agent-kit/README.md).

Non-negotiables:

- **Systems, not static content.** Every content feature is a system (model → store → dynamic render → authoring), built on the reusable content-system primitive. A blog is a blog *system*, not hardcoded pages. See [`agent-kit/conventions.md`](agent-kit/conventions.md).
- **DRY + the four-axis model** (Access · Data · Telemetry · Rendering). Compose shared machinery; never reimplement plumbing.
- **`main` is always deployed and protected.** Work flows branch → PR → green CI → merge. Branch from the latest `origin/main`. See [`agent-kit/commit-and-pr.md`](agent-kit/commit-and-pr.md).
- **This is a public repo.** Nothing private ships — secrets, PII, employer-confidential. See [`agent-kit/oss-safety.md`](agent-kit/oss-safety.md).
- **Done means done.** [`agent-kit/definition-of-done.md`](agent-kit/definition-of-done.md): typecheck + lint + build green, changeset added, oss-safety passed, docs updated.

Skills: `/commit`, `/ship`, `/oss-check`, `/devils-advocate`, `/feature`.

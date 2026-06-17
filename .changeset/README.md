# Changesets

Every PR that touches application code must add a changeset here. CI enforces it. See [`agent-kit/commit-and-pr.md`](../agent-kit/commit-and-pr.md) for the full workflow and the rationale in [ADR 0001](../docs/decisions/0001-changesets-not-changelog.md).

## Format

Create `.changeset/<kebab-slug>.md`:

```markdown
---
type: feat
summary: One-line imperative summary
---

Human-facing description of the change. Can be multiple paragraphs.
```

- `type` — one of: `feat`, `fix`, `refactor`, `perf`, `style`, `test`, `docs`, `build`, `ops`, `chore` (same vocabulary as commit types — see [`agent-kit/commit-and-pr.md`](../agent-kit/commit-and-pr.md#types)).
- `summary` — one line, imperative mood.
- Body — what changed and why, for the changelog reader.
- **Do not** put datetime or commit hash here — they're added at compile time from git.

## Compiling

On release:

```bash
npm run changelog
```

This runs `scripts/compile-changelog.mjs`, which prepends a dated entry per changeset to `CHANGELOG.md` (`datetime · short-hash · type: summary · description`) and then deletes the consumed `.changeset/*.md` files. `README.md` (this file) is never consumed.

# Commit & PR Workflow

`main` is **always deployed**. It is protected: no direct pushes. Every change flows branch → PR → green CI → merge.

## Branch flow

1. `git fetch origin` — always start from the *latest* `origin/main`.
2. Branch off it: `git checkout -b <type>/<short-desc> origin/main`.
3. Commit (see below). Push with `-u`.
4. Open a PR to `main`. Merge only when CI is green.

Branch name prefixes match commit types: `feat/`, `fix/`, `refactor/`, `docs/`, `test/`, `chore/`, `perf/`, `ci/`.

The `/ship` skill automates fetch → branch → push → PR.

## Commit format (Conventional Commits)

```
<type>: <description>

<optional body>
```

Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`.

No attribution/co-author trailers (disabled globally).

## Changesets (mandatory for code changes)

Every PR that touches application code **must add a changeset**. CI fails otherwise.

A changeset is a file `.changeset/<kebab-slug>.md`:

```markdown
---
type: feat
summary: Add blog system with draft support
---

Posts are now stored in the content collection and rendered dynamically.
Includes an authoring path behind the owner-only access tier.
```

- `type` — same vocabulary as commit types.
- `summary` — one line, imperative.
- Body — the human-facing change description.
- **Datetime and commit hash are NOT written here** — they're filled at compile time from git.

Compilation is **automated**: the `Release` workflow (`.github/workflows/release.yml`) runs after every merge to `main`, runs `npm run changelog` (`scripts/compile-changelog.mjs`) to concatenate all `.changeset/*.md` into `CHANGELOG.md` grouped by date as `datetime · short-hash · type: summary · description`, clears the consumed changeset files, and opens a small auto-merging PR with the result (surfaced at `/changelog`). You can still run `npm run changelog` locally. See [ADR 0004](../docs/decisions/0004-release-automation.md).

The `/commit` skill offers to create a changeset if one is missing.

## Pre-commit reviews (automated, non-blocking)

`/commit` runs two subagent reviews and surfaces findings for your approval — they advise, they don't block:

- **devil's-advocate** (`/devils-advocate`) — argues against the change: risks, simpler alternatives, scope creep.
- **oss-safety** (`/oss-check`) — checks nothing private is going public (see [oss-safety.md](./oss-safety.md)).

The hard gates (secret scan, changeset presence, typecheck/lint/build) live in CI, not in these skills.

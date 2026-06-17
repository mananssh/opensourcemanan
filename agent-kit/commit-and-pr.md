# Commit & PR Workflow

`main` is **always deployed**. It is protected: no direct pushes. Every change flows branch → PR → green CI → merge.

## Branch flow

1. `git fetch origin` — always start from the *latest* `origin/main`.
2. Branch off it: `git checkout -b <type>/<short-desc> origin/main`.
3. Commit (see below). Push with `-u`.
4. Open a PR to `main`. Merge only when CI is green.

Branch name prefixes match commit types: `feat/`, `fix/`, `refactor/`, `perf/`, `style/`, `test/`, `docs/`, `build/`, `ops/`, `chore/`.

The `/ship` skill automates fetch → branch → push → PR.

## Commit format (Conventional Commits)

```
<type>(<optional scope>): <description>

<optional body>

<optional footer>
```

### Types

Pick by *what the change affects*, not by how big it is. Based on
[qoomon's taxonomy](https://gist.github.com/qoomon/5dfcdf8eec66a051ecd85625518cfd13#types).

| Type | Use for |
| ---- | ------- |
| `feat` | Adds, adjusts, or removes a feature of the API or UI |
| `fix` | Fixes an API or UI bug of a preceding `feat` |
| `refactor` | Rewrites/restructures code without changing API or UI behavior |
| `perf` | A refactor that specifically improves performance |
| `style` | Code style only (whitespace, formatting, semicolons) — no behavior change |
| `test` | Adds missing tests or corrects existing ones |
| `docs` | Documentation only |
| `build` | Build tooling, dependencies, project version (e.g. `package.json` deps) |
| `ops` | Infrastructure, deployment scripts, CI/CD, monitoring, backups, recovery |
| `chore` | Misc tasks: initial commit, `.gitignore`, repo housekeeping |

Quick discriminators for this repo:

- A GitHub workflow, the Vercel build-skip / prune scripts, deployment config → **`ops`**, not `feat`/`chore`.
- A dependency bump or `package.json` script wiring → **`build`**.
- Changing what the site *does* for a visitor or the owner → **`feat`** (or **`fix`** if repairing a prior `feat`).

### Scope (optional)

`feat(blog):`, `fix(auth):`, `ops(vercel):`. A short noun for the area touched.
Project-defined and free-form; **never** an issue identifier.

### Breaking changes

Mark with `!` before the colon: `feat(api)!: remove status endpoint`. Describe
the break in the commit footer when the subject isn't self-explanatory.

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

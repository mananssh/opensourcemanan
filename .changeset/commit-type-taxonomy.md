---
type: build
summary: Adopt fuller commit/changeset type taxonomy (adds ops, build, style)
---

Documented the full Conventional Commits type set in agent-kit/commit-and-pr.md
(feat, fix, refactor, perf, style, test, docs, build, ops, chore) with a table,
optional scopes, and the `!` breaking-change indicator, based on qoomon's
taxonomy. Notably `ops` (infra/CI/CD/deploy) and `build` (build tooling/deps)
now have a home instead of being lumped into chore/feat. The changelog compiler
and .changeset/README accept the same vocabulary (dropped the unused `ci` in
favor of `ops`).

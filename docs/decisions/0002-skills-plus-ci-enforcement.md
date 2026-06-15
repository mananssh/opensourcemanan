# ADR 0002 — Skills + CI enforcement, no local git hooks

**Status:** Accepted · **Date:** 2026-06-15

## Context

We want guarantees: PRs to main, changesets present, secret scanning, green typecheck/lint/build, and safety reviews. Enforcement can live in Claude Code skills, local git hooks (e.g. husky), CI, and GitHub branch protection.

## Decision

Enforce with **skills (for ergonomics) + CI (the hard gate) + GitHub branch protection**. **No local git pre-commit hooks.**

## Rationale

- **Skills are advisory** — a skill can be skipped or invoked outside its happy path. Good for ergonomics, not for guarantees.
- **CI is the source of truth** — it runs server-side on every PR and cannot be bypassed; pair it with branch protection requiring checks to pass before merge.
- **Local git hooks add friction** and are easy to skip (`--no-verify`) or to have unset on a fresh clone; they duplicate what CI already guarantees. We skip them deliberately.
- **Reviews (devil's-advocate, oss-safety)** are automated subagents that surface findings for approval — **non-blocking**, because judgment calls belong to the author; the *mechanical* secret scan is the blocking part and lives in CI.

## Consequences

- The mandatory guarantees (changeset present, secrets, typecheck/lint/build) are CI jobs.
- `main` has branch protection: require PR, require CI green, no direct push.
- `/commit`, `/ship`, `/oss-check`, `/devils-advocate` provide the smooth path but never *are* the guarantee.

# ADR 0001 — Changeset files, not a single CHANGELOG

**Status:** Accepted · **Date:** 2026-06-15

## Context

We want every change recorded with datetime, commit, message, and a description, compiled into a changelog. Two obvious options: append directly to a single `CHANGELOG.md` per commit, or use the `@changesets/cli` tool.

## Decision

Use a **lightweight homegrown changeset convention**: one `.changeset/<slug>.md` file per change, compiled into `CHANGELOG.md` on release by `scripts/compile-changelog.mjs`.

## Rationale

- **Single `CHANGELOG.md` appended per commit** → constant merge conflicts when multiple branches/PRs are open, since they all edit the same lines.
- **`@changesets/cli`** is built for **versioning and publishing npm packages** (semver bumps, monorepo package graphs). This is a deployed app, not a published package — that machinery is overhead we don't need and a dependency we'd carry.
- **Homegrown changeset files** give us the conflict-free, one-file-per-change ergonomics with zero runtime dependency and a format we fully control (datetime + hash filled at compile time from git, which a pre-commit file can't know).

## Consequences

- CI enforces that code changes ship with a changeset file.
- A small Node ESM script owns compilation; no new dependency.
- If we ever publish packages from here, revisit `@changesets/cli`.

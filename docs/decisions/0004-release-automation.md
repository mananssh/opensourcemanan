# ADR 0004 — Automated changelog release on merge to main

**Status:** Accepted · 2026-06-15

## Context

Changesets accumulate in `.changeset/` per PR, but `CHANGELOG.md` is only
produced by `npm run changelog` (the "release" step). Originally manual, so the
public `/changelog` page lagged behind what had actually shipped. We want the
changelog to update automatically after every merge.

Two constraints shape the design:

1. **`main` is protected** — PRs are required and `enforce_admins` is on, so
   *nothing* can push directly to `main`, including a bot.
2. **The compiled format embeds the commit short-hash**, sourced from `HEAD` at
   compile time. The correct hash only exists *after* merge (the squash commit),
   so compilation must happen post-merge on `main`, not inside the feature PR.

## Decision

A `Release` workflow runs on push to `main`. It compiles pending changesets and,
if anything changed, opens a **small auto-merging PR** (`release/changelog-*`)
with the updated `CHANGELOG.md` and the consumed changesets removed. Branch
protection stays fully intact — the changelog reaches `main` through the front
door, not a bypass.

It authenticates with a **fine-grained PAT** (`RELEASE_TOKEN` secret), not the
default `GITHUB_TOKEN`. GitHub deliberately does not trigger workflows for PRs
opened by `GITHUB_TOKEN` (loop prevention); such a PR's required checks would
never run and auto-merge would never fire. A PAT-opened PR triggers CI normally.

Loop safety: when the release PR merges, the resulting push to `main` re-runs the
workflow, finds no pending changesets, and exits without opening a PR.

## Alternatives rejected

- **Direct push to `main` from CI** — requires giving a bot bypass over branch
  protection, weakening the guarantee that everything goes through a reviewed,
  CI-gated PR. Not worth it for a cosmetic changelog commit.
- **Compile inside the feature PR** — the hash would be wrong (pre-squash), and
  consuming the changeset in the same PR would fail the "changeset present"
  check. Compilation must be post-merge.
- **Changesets-style standing "Version PR" bot** — more machinery than a solo
  site needs; the per-merge auto-PR is simpler and good enough.

## Setup required (one-time, manual)

Create a fine-grained PAT (repo-scoped: **Contents: Read and write**,
**Pull requests: Read and write**) and add it as the `RELEASE_TOKEN` repository
secret. "Allow auto-merge" is enabled on the repo. Until the secret exists, the
workflow fails fast on checkout — no changelog automation, but nothing else
breaks.

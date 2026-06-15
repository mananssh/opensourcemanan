# Architecture

This is the all-in-one personal site for Manan — portfolio, blog, and whatever comes next — deployed to Vercel on a custom domain, public by intent.

> **How we build** (the rules agents and humans follow) lives in [`agent-kit/`](../agent-kit/). This doc is the high-level human overview. Start with [`agent-kit/conventions.md`](../agent-kit/conventions.md) for the architecture model.

## Principles (summary)

- **Systems, not static content.** Content features are systems (model → store → dynamic render → authoring), built on one reusable content-system primitive. Blog/projects/notes are configurations of it.
- **Four orthogonal axes.** Every feature composes Access · Data · Telemetry · Rendering, each backed by shared machinery built once.
- **DRY + extensibility.** Adding a feature = assembling existing pieces.

## Stack

- **Next.js 16** (App Router), **React 19**, **Tailwind 4**, **TypeScript**. Note: this Next.js diverges from training-data assumptions — see root `AGENTS.md`.
- **Hosting:** Vercel.
- **Data store:** TBD (chosen when the first content feature lands).

## Workflow & CI

- `main` is always deployed and protected. Work flows branch → PR → green CI → merge.
- CI (`.github/workflows/ci.yml`): typecheck, lint, build, gitleaks secret scan, changeset-present check.
- Changes recorded via [changeset files](../.changeset/README.md), compiled to `CHANGELOG.md` on release.
- See [`agent-kit/commit-and-pr.md`](../agent-kit/commit-and-pr.md).

## Deploying to Vercel (one-time setup)

Vercel's GitHub integration handles deploys — **no workflow YAML needed**:

1. Go to [vercel.com/new](https://vercel.com/new) → **Import** `mananssh/opensourcemanan`.
2. Framework preset auto-detects **Next.js**. Keep defaults (`next build`).
3. Set environment variables in **Project Settings → Environment Variables** (never in source).
4. After import:
   - **Production deploy** runs automatically on every merge to `main`.
   - **Preview deploy** runs automatically on every PR (unique URL per PR).
5. Add the custom domain under **Project Settings → Domains**.

## Decisions

Architectural decisions are recorded in [`docs/decisions/`](./decisions/). See:
- [0001 — Changesets, not a single CHANGELOG](./decisions/0001-changesets-not-changelog.md)
- [0002 — Skills + CI enforcement, no local git hooks](./decisions/0002-skills-plus-ci-enforcement.md)

---
allowed-tools: Read, Write, Edit, Grep, Glob, Bash(git checkout:*), Bash(git branch:*), Agent
description: Scaffold a new feature as a SYSTEM (model -> store -> dynamic route -> authoring), per the four-axis + content-system convention. The DRY enforcer.
---

# /feature

Scaffold a new feature the right way: as a **system, not static content**, composed from the four shared axes. This is where DRY gets enforced in practice. Read `agent-kit/conventions.md` first — it is the contract.

## Steps

1. **Read the convention.** `agent-kit/conventions.md` — the systems-not-static principle, the content-system primitive, and the four-axis model.

2. **Clarify the feature's axis choices** (ask the user if unclear):
   - **Access**: `public` / `authed` / `role`-or-`owner`.
   - **Data**: `static` / `db` / `external` — and if it's content that grows, it's a **collection on the content-system primitive**, not pages.
   - **Telemetry**: `none` / `pageview` / `events`.
   - **Rendering**: `page` / `api` / `both`.

3. **Reuse before building.** Search for existing primitives (content-system, `requireAuth`, `track`, UI components, data-access layer). Scaffold should *assemble* these. Only create new shared machinery if it genuinely doesn't exist — and if you do, build it as a reusable primitive, not a one-off.

4. **Branch.** Start on a feature branch off latest `origin/main` (see `/ship`).

5. **Scaffold the system skeleton**:
   - Data model / schema (a collection config when content-shaped).
   - Store/data-access wiring (no business logic duplicated across features).
   - Dynamic route(s) — list/detail rendered from data, never hardcoded per item.
   - An authoring/create path where applicable.
   - Declarative manifest entry for nav + access + telemetry — config-driven surface.

6. **Note the Next.js caveat.** Read `node_modules/next/dist/docs/` before writing Next.js code — this version diverges from training-data assumptions.

7. **Finish per the checklist**: `agent-kit/definition-of-done.md` (add a changeset, run `/oss-check`, etc.).

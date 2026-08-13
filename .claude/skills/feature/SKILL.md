---
allowed-tools: Read, Write, Edit, Grep, Glob, Bash(git checkout:*), Bash(git branch:*), Agent
description: >-
  Scaffold a new feature as a SYSTEM (model -> store -> dynamic route ->
  authoring), per the four-axis + content-system convention. The DRY enforcer.
  Any feature with UI must run /design-review during planning before components.
---

# /feature

Scaffold a new feature the right way: as a **system, not static content**, composed from the four shared axes. This is where DRY gets enforced in practice. Read `agent-kit/conventions.md` first — it is the contract.

## Hard gate: UI → `/design-review`

If the feature has **any user-facing UI** (Rendering `page` or `both`, a layout, a page, or components under `app/` / `components/`), you **must**:

1. **Read** `.claude/skills/design-review/SKILL.md` (and its `references/` as needed).
2. **Run** that workflow during planning — mood, type, full OSM token overrides, motion, `docs/design/<slug>.md`, `.vertical-*` plan — **before** writing UI components.
3. Treat a missing brief or inherited Editorial tokens as **not done**.

API-only features with no chrome may skip design-review. When unsure, run it.

## Steps

1. **Read the convention.** `agent-kit/conventions.md` — the systems-not-static principle, the content-system primitive, and the four-axis model.

2. **Clarify the feature's axis choices** (ask the user if unclear):
   - **Access**: `public` / `authed` / `role`-or-`owner`.
   - **Data**: `static` / `db` / `external` — and if it's content that grows, it's a **collection on the content-system primitive**, not pages.
   - **Telemetry**: `none` / `pageview` / `events`.
   - **Rendering**: `page` / `api` / `both`.

3. **Plan the look (mandatory for UI).** If Rendering is `page` or `both`, or there is any user-facing surface: run **`/design-review` now** (ADR 0006). Lock mood, hero archetype, type stack, light+dark token override table, motion plan; write `docs/design/<slug>.md`. **Do not** match Editorial Logbook or sibling verticals for "consistency." Do this **before** components — data/schema work may proceed in parallel after the brief exists.

4. **Reuse before building.** Search for existing primitives (content-system, `requireAuth`, `track`, UI components, data-access layer). Scaffold should *assemble* these. Only create new shared machinery if it genuinely doesn't exist — and if you do, build it as a reusable primitive, not a one-off.

5. **Branch.** Start on a feature branch off latest `origin/main` (see `/ship`).

6. **Scaffold the system skeleton**:
   - Data model / schema (a collection config when content-shaped).
   - Store/data-access wiring (no business logic duplicated across features).
   - Dynamic route(s) — list/detail rendered from data, never hardcoded per item.
   - An authoring/create path where applicable.
   - Declarative manifest entry for nav + access + telemetry — config-driven surface.
   - For UI: implement `.vertical-<name>` + fonts from the design brief; build components against that brief only.

7. **Note the Next.js caveat.** Read `node_modules/next/dist/docs/` before writing Next.js code — this version diverges from training-data assumptions.

8. **Finish per the checklist**: `agent-kit/definition-of-done.md` (design-review item for UI, changeset, `/oss-check`, etc.).

# ADR 0006 — Conscious frontend design review before building UI

**Status:** Accepted · 2026-06-15

## Context

The first pass at the site shipped untouched `create-next-app` aesthetics —
default fonts (Arial/Geist), zinc palette, scaffold home page. It looked
generically "AI-generated" because no deliberate design choice was ever made.
Good design doesn't happen by default; it has to be a conscious step.

## Decision

**Before building any new UI surface, run a deliberate design review** (the
`/design-review` skill). The review commits, on the record, to:

- an **aesthetic direction** (tone/concept), not a default;
- **distinctive typography** — no system fonts, no Inter/Roboto, no overused
  picks; a display + body + mono pairing with character;
- a **light + dark token set** (see ADR 0005);
- **differentiation** — the one thing that makes the surface memorable.

The site's baseline is the **Editorial Logbook** system (Fraunces + Newsreader +
JetBrains Mono, warm paper/ink, oxblood/terracotta accent). New surfaces match it
unless they *consciously* diverge — and a divergence is itself a design-review
decision, not an accident.

The Definition of Done has a "design review done" item for UI work, and
`/feature` points at `/design-review` before scaffolding a UI.

## Consequences

- A small upfront step per UI feature; the payoff is a coherent, non-generic
  site that actually has a point of view.
- Avoids slow-creep back to defaults: the bar is explicit and checked.
- `/design-review` is advisory (a thinking tool), not a CI gate — taste can't be
  linted.

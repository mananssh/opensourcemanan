# ADR 0006 — Conscious frontend design review before building UI

**Status:** Accepted · 2026-06-15 · **Updated 2026-08-14**

## Context

The first pass at the site shipped untouched `create-next-app` aesthetics —
default fonts (Arial/Geist), zinc palette, scaffold home page. It looked
generically "AI-generated" because no deliberate design choice was ever made.
Good design doesn't happen by default; it has to be a conscious step.

A later failure mode appeared once the site had a strong home aesthetic: new
surfaces **reused Editorial Logbook** (warm paper, Fraunces/Newsreader, oxblood)
by default "for consistency." That produced a site of cousins instead of
distinct rooms. Verticals already support full token overrides (ADR 0010); the
design skill must *require* using them.

## Decision

**Before building any new UI surface, run `/design-review`.** The review commits,
on the record, to:

- a **mood** derived from the feature (not from sibling pages);
- an **aesthetic direction** + one bold layout risk;
- **one hero archetype** (kinetic type, shader field, cinematic media,
  editorial split, or marquee) when the surface has a marketing/catalog fold;
- **distinctive typography** — display + body + mono; no Inter/Roboto/system as
  the voice; no lazy reuse of Editorial's Fraunces + Newsreader stack;
- a **full light + dark token override table** that replaces OSM `:root` /
  `.dark` defaults (`--paper`, `--surface`, `--ink`, `--muted`, `--faint`,
  `--rule`, `--accent`, `--accent-soft`, font family tokens, plus bridge/chart
  tokens when needed) under `.vertical-<name>` (ADR 0010);
- a short **motion plan** (composition, not decoration; respect reduced motion);
- a written brief at **`docs/design/<slug>.md`**.

**Uniqueness is the default.** Sibling verticals owe each other nothing visually.
Matching Editorial Logbook (or copying Reel/Vault/ARCD/Blog tokens) is allowed
only when the user explicitly asks to extend that vertical — never as the
starting assumption.

The skill incorporates agency/motion-frontend craft (tokens first, hard
anti-slop, orchestrated motion) adapted to this multi-vertical Next app — it
does not scaffold a greenfield marketing site.

The Definition of Done has a "design review done" item for UI work.
`/feature` runs `/design-review` during **planning** (before components) whenever
Rendering includes a page or any user-facing chrome. Frontend work outside
`/feature` still must run `/design-review` on its own. `/commit` and
`/devils-advocate` call out missing briefs or Editorial-token leaks on UI diffs.
The PR template includes a design-review checkbox.

## Consequences

- Upfront design work per UI feature; payoff is a site of distinct, cool rooms
  instead of recolored Editorial.
- Agents must invent palettes and type every time and document overrides —
  slower than "match home," higher floor on taste.
- `/design-review` remains advisory (not a CI gate) — taste can't be linted, but
  missing `docs/design/<slug>.md` or missing `.vertical-*` overrides is an
  author-responsibility miss against the Definition of Done.

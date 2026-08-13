---
name: design-review
description: >-
  OSM frontend design skill — REQUIRED for any feature planning with UI,
  any new/changed page, layout, vertical, or user-facing components.
  Mood-first, motion-aware, per-vertical uniqueness. Invent aesthetic
  (colors, type, motion, hero); never inherit Editorial or sibling pages.
  /feature runs this during planning before components. Writes
  docs/design/<slug>.md + .vertical-* overrides. Use when planning a
  feature, building frontend, redesigning a surface, or touching app/
  components UI. Inspired by motion-frontend agency craft.
---

# OSM frontend design (mood · motion · override)

**This is not a polish pass.** Before any UI for a new page, route, or
vertical: invent a look from the feature's mood, override every OSM
default token, and commit to motion that feels intentional. Sibling pages
owe each other **nothing**. Matching Editorial Logbook is a failure mode.

Philosophy borrowed from `~/.claude/skills/motion-frontend`: aesthetic from
constraints, tokens before components, one hero archetype, hard anti-slop,
motion as composition — adapted for this multi-vertical Next app.

## Non-negotiables

1. **Mood first, brand second.** Derive the aesthetic from what this surface
   *is* (arcade, vault, lab, diary, shop, tool…). Do not start from existing
   OSM colors/fonts and "tweak."
2. **Zero inheritance.** Do not reuse another vertical's palette, type stack,
   radius, or motion language unless the user *explicitly* asks to extend that
   vertical. Default = invent.
3. **Override OSM defaults explicitly.** Every semantic token that would leak
   through from `:root` / `.dark` must be listed and replaced under
   `.vertical-<name>`. See [references/token-override.md](references/token-override.md).
4. **It must look fucking cool.** If the first viewport could pass as a
   generic SaaS template or "another OSM page with a different accent,"
   scrap it and pick harder.
5. **Light + dark both.** Invent both modes for this vertical (ADR 0005).
6. **Motion is composition.** At least one orchestrated entrance or scroll
   beat; respect `prefers-reduced-motion`. See motion rules below.
7. **Write the brief.** `docs/design/<slug>.md` before coding UI. No brief =
   not done.

## When to use (mandatory)

Run this skill — read this file and complete the workflow — whenever **any** of
these are true:

- Planning or scaffolding a **feature** that has UI (`/feature` step 3)
- Adding or materially changing a **page, layout, or vertical**
- Building or redesigning **user-facing components** (not tiny bugfix copy)
- The user asks for a new look, landing, or frontend for anything in this repo

Skip **only** for pure plumbing with no user-facing chrome (API-only, schema-
only, infra). When unsure, run it.

## Workflow

### 1. Mood lock (30 seconds)

Name the mood in **one phrase** from the feature brief — not the product
category. Examples: "humid midnight arcade," "cold archival steel,"
"sun-bleached field notes," "wet neon underpass."

If the brief is vague, **spin the roulette** in
[references/mood-roulette.md](references/mood-roulette.md) and pick one that
fits. Do not pick "editorial logbook / warm paper" unless building the home
Editorial itself.

### 2. Aesthetic direction (commit out loud)

State in the brief:

- **Direction name** (2–4 words)
- **Why this mood** (1–2 sentences tied to the feature)
- **One bold layout risk** you will take (clipped type, full-bleed media,
  brutal asymmetry, kinetic marquee, shader field, etc.)
- **Hero archetype** — pick **exactly one** from the list below
- **Anti-goals** — 3 things this page will *not* look like (include
  "Editorial Logbook" and at least one sibling vertical)

### 3. Type (distinctive, not Inter)

Pick a **display + body + mono** stack that serves the mood. Prefer
`next/font` (Google) or a clear CDN face already justified in the brief.

| Role | Job |
|------|-----|
| Display | Hero / section titles — expressive, mood-matched |
| Body | Reading — paired for contrast or cohesion on purpose |
| Mono | Micro-labels, indexes, meta — tracking + uppercase OK |

**Forbidden defaults:** Inter, Roboto, Arial, system-ui as the *voice* of the
page. **Forbidden OSM reuse:** Newsreader + Instrument Sans + Fraunces as the
stack for a *new* vertical (those are Editorial). Invent again.

Declare CSS variables on the vertical wrapper, e.g. `--font-display`,
`--font-body`, `--font-mono` (and wire `next/font` in the vertical layout).

### 4. Token override table (mandatory)

Copy the checklist from
[references/token-override.md](references/token-override.md). Fill **every**
row for light and dark. No "keep OSM default" unless the cell is truly
irrelevant (e.g. charts on a page with no charts — still set them for
consistency).

Then implement as:

```css
.vertical-<name> {
  /* fonts + all color tokens + radius */
}
.dark .vertical-<name> {
  /* dark counterparts — invent, don't only invert */
}
```

Apply `className="vertical-<name>"` on the vertical layout shell
(see ADR 0010).

**Ship the table in `docs/design/<slug>.md`** so humans and agents see what
was overridden.

### 5. Hero archetype (pick one)

From motion-frontend agency craft — choose **one**:

| Archetype | Feel |
|-----------|------|
| **Kinetic type** | Huge clamp() display, lines clipped by viewport, mono micro-labels, almost no imagery |
| **Shader / gradient field** | Full-bleed WebGL or CSS field; type sits in the atmosphere |
| **Cinematic media** | Edge-to-edge image/video plane; type secondary; no inset cards |
| **Editorial split** | Asymmetric text/media split — only when the mood is *print*, not as OSM default |
| **Marquee / strip** | Oversized looping strip; aggression + pace |

Do **not** ship a centered card stack hero, icon-row features, or "navbar +
headline + three columns."

### 6. Motion (composition, not decoration)

Follow [references/motion.md](references/motion.md). This repo already has
`motion` / `framer-motion`. For scroll-heavy landings, Lenis + GSAP
ScrollTrigger are fair game when the mood needs them (add deps only if the
brief demands; don't add weight for a settings form).

Rules:

- **Orchestrate** — shared timing/easing, staggered reveals tied to scroll or
  load; not random `animate-bounce` on every widget.
- **Hero gets the budget** — one strong entrance; body sections quieter.
- **Reduced motion** — CSS `@media (prefers-reduced-motion: reduce)` and/or
  Motion's `useReducedMotion`; skip parallax/scrub when reduced.
- **Never** motion-everywhere, emoji confetti CTAs, or decorative animation
  that doesn't clarify hierarchy.

Minimum bar for a marketing/catalog vertical: **2–3 intentional motions**
(e.g. hero type reveal, one scroll fade, one hover affordance).

### 7. Layout & craft

- First viewport = **one composition** (brand/name signal, one headline, one
  line of support, one CTA group, one dominant visual idea).
- Large section padding (`clamp`); avoid timid whitespace.
- Radius: default **sharp** (`0` or tiny) unless the mood is soft/toy/bubbly —
  then say so in the brief.
- Imagery: real product/place/atmosphere when possible; abstract gradients
  alone are not the main idea unless the archetype is shader-field.
- Mobile: same attitude, reflowed — not a shrunk desktop.

### 8. Anti-patterns (instant reject)

- Reusing Editorial cream/ink/terracotta or "just change primary"
- Matching Reel / Vault / ARCD / any sibling "for consistency"
- Purple-on-white / purple–indigo AI gradient kits
- Warm cream + terracotta serif broadsheet as the lazy default
- Centered card heroes, feature icon grids, testimonial carousels as the
  first fold
- Tailwind `gray-*` / `indigo-*` as the brand palette
- Flat single-fill backgrounds with no atmosphere
- Light-only or dark-only verticals
- Shipping UI without `docs/design/<slug>.md` and without `.vertical-*`
  overrides

### 9. Output checklist

Before writing components:

- [ ] Mood phrase + direction name locked
- [ ] Hero archetype chosen
- [ ] Type stack chosen (display / body / mono) — not OSM Editorial
- [ ] Full light + dark token override table filled
- [ ] `docs/design/<slug>.md` written
- [ ] `.vertical-<name>` (+ `.dark` variant) planned for `app/globals.css`
- [ ] Motion plan (2–3 beats) + reduced-motion note
- [ ] Anti-goals listed (including Editorial + one sibling)

Then build UI against that brief. If mid-build you catch yourself reaching for
`--primary` from root without a vertical override — stop and fix tokens first.

## Brief template (`docs/design/<slug>.md`)

```markdown
# <Feature> — design brief

## Mood
<one phrase>

## Direction
**Name:** …
**Why:** …
**Bold risk:** …
**Hero archetype:** kinetic-type | shader-field | cinematic-media | editorial-split | marquee

## Anti-goals
- Not Editorial Logbook
- Not <sibling vertical>
- Not <generic SaaS / AI-slop look>

## Type
| Role | Family | Role on page |
|------|--------|--------------|
| Display | … | … |
| Body | … | … |
| Mono | … | … |

## Token overrides (OSM Editorial defaults → this vertical)

| Token | OSM light | OSM dark | This light | This dark |
|-------|-----------|----------|------------|-----------|
| --paper | #efe7d6 | #15120d | … | … |
| --surface | #f8f2e4 | #1d1811 | … | … |
| --ink | #241d12 | #ece4d5 | … | … |
| --muted | #574c39 | #a0937f | … | … |
| --faint | #6a5e49 | #8e8472 | … | … |
| --rule | #d2c3a5 | #322a1e | … | … |
| --accent | #8c2b1c | #db6a4a | … | … |
| --accent-soft | #e6d6bc | #2a201a | … | … |
| --display-family | Fraunces | — | … | … |
| --body-family | Newsreader | — | … | … |
| --mono-family | JetBrains Mono | — | … | … |

(Complete every row from references/token-override.md — including accent-2 /
accent-ink / shadcn bridge when needed. **No blank = Editorial leak.**)

## Motion
- Hero: …
- Scroll: …
- Hover: …
- Reduced motion: …

## Layout notes
…
```

## Relationship to other docs

- **ADR 0005** — light + dark required.
- **ADR 0006** — this skill; mood-random uniqueness supersedes "match Editorial."
- **ADR 0010** — implement overrides via `.vertical-*`.
- **`/feature`** — runs this skill at planning step 3 whenever the feature has UI.
- **`/commit` / `/devils-advocate`** — flag missing briefs or Editorial-token leaks on UI diffs.
- **motion-frontend** (`~/.claude/skills/motion-frontend`) — deeper hero
  snippets & stack notes; this skill is the OSM-adapted law.

## What this skill is not

- A request to make every page loud for its own sake — cool means
  *intentional*, not cluttered.
- Permission to skip a11y, contrast, or reduced motion.
- A reason to fork the design system into unmaintainable one-offs without
  tokens — uniqueness lives in **tokens + type + composition**, still using
  shared primitives (`Button` variants, cn, etc.) where they help.

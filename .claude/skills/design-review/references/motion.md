# Motion (OSM-adapted)

Borrowed from `~/.claude/skills/motion-frontend`: motion is composition, not
decoration. Encode constraints so the page feels expensive without animating
everything.

## Stack available here

| Tool | Use when |
|------|----------|
| `motion` / `framer-motion` (already in repo) | Entrances, layout, hover, shared variants |
| Lenis + GSAP ScrollTrigger | Scroll-heavy landings that need pins/scrubs — add only if the brief demands |
| ogl / R3F | Shader-field heroes — only when archetype is shader and mood needs it |

Do not scaffold a greenfield Next app. Wire motion into the vertical you are
building.

## Rules

1. **One orchestrated moment per section** — shared easing/stagger; no random
   fade-ins on every block.
2. **Hero owns the budget** — strongest beat on first viewport.
3. **Type can clip** — `clamp()` display, `overflow-x: clip`, tight tracking on
   display; wide-tracked mono micro-labels (~11px, `0.15em`, uppercase).
4. **Section padding large** — `clamp(6rem, 14vh, 12rem)` bias for landings.
5. **Radius default 0** unless the mood is soft — say so in the brief.
6. **`prefers-reduced-motion`** — skip parallax/scrub; keep opacity/transform
   cuts instant or very short.
7. **Focus visible** — motion never replaces keyboard affordances.

## Minimum bar (catalog / marketing verticals)

Document and ship at least:

- Hero entrance (type reveal, media fade, or marquee start)
- One scroll-tied reveal
- One hover/focus affordance on primary CTA or interactive row

Forms and owner tools can stay quieter — still pick tokens + type; motion can
be minimal.

## Anti-patterns

- Motion on everything
- Emoji confetti CTAs
- Bounce/pulse as personality
- Parallax that fights scroll on mobile
- Ignoring reduced motion

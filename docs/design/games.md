# ARCD — design brief: "Cabinet After Hours"

`/games` vertical branded **ARCD**. Full redesign — replaces the previous
"Floor" (Syne / rose / charcoal / unDraw-as-hero) look.

## Mood

**phosphor after closing time** — CRT cabinets still humming, house lights off,
sticky coin lip, green glow on black plastic.

## Direction

**Name:** Cabinet After Hours  
**Why:** An arcade after midnight is not a SaaS landing and not a quiet product
floor. The room is dark, the marquees are loud, the only warmth is the tube and
the coin.  
**Bold risk:** Full-bleed **kinetic marquee** owns the first viewport — type
that never stops moving — then a clipped display wordmark. Illustration is
demoted below the fold (empty-cabinet atmosphere), not co-hero.  
**Hero archetype:** marquee

## Anti-goals

- Not Editorial Logbook (warm paper / Fraunces / oxblood)
- Not previous ARCD "Floor" (Syne + rose charcoal + unDraw hero split)
- Not Vault (brushed steel / brass) or Reel (Last Showing / sodium)
- Not centered card-stack / purple gradient AI SaaS

## Type

| Role | Family | Role on page |
|------|--------|--------------|
| Display | **Big Shoulders** | ARCD wordmark, section titles — condensed poster |
| Body | **Sora** | Support copy, catalog blurbs |
| Mono | **Share Tech Mono** | Micro-labels, marquee ticks, indexes |

## Token overrides (OSM Editorial defaults → ARCD)

| Token | OSM light | OSM dark | This light | This dark |
|-------|-----------|----------|------------|-----------|
| `--paper` | `#efe7d6` | `#15120d` | `#e4efe8` | `#030805` |
| `--surface` | `#f8f2e4` | `#1d1811` | `#f2f8f4` | `#0a1210` |
| `--ink` | `#241d12` | `#ece4d5` | `#0a1410` | `#d8ffe8` |
| `--muted` | `#574c39` | `#a0937f` | `#3d5248` | `#7aab90` |
| `--faint` | `#6a5e49` | `#8e8472` | `#5a6e64` | `#5a8670` |
| `--rule` | `#d2c3a5` | `#322a1e` | `#c0d0c6` | `#1a2e24` |
| `--accent` | `#8c2b1c` | `#db6a4a` | `#0b7a3c` | `#3dff8a` |
| `--accent-2` | — | — | `#b86e00` | `#ffc14a` |
| `--accent-soft` | `#e6d6bc` | `#2a201a` | `#cfe8d9` | `#0d2818` |
| `--accent-ink` | — | — | `#ffffff` | `#030805` |
| `--display-family` | Fraunces | — | Big Shoulders | — |
| `--body-family` | Newsreader | — | Sora | — |
| `--mono-family` | JetBrains Mono | — | Share Tech Mono | — |

### Bridge + charts

| Token | Light | Dark |
|-------|-------|------|
| `--background` / `--foreground` | paper / ink | paper / ink |
| `--primary` / `--primary-foreground` | accent / accent-ink | accent / accent-ink |
| `--secondary` / `--secondary-foreground` | accent-soft / ink | accent-soft / ink |
| `--muted-foreground` | muted | muted |
| `--destructive` | `#b42318` | `#ff6b6b` |
| `--border` / `--input` / `--ring` | rule / rule / accent | same |
| `--chart-1`…`5` | accent, accent-2, muted greens/ambers | bright phosphor set |

**Radius:** `0` — sharp cabinet edges. No pill CTAs.

## Motion

- **Hero:** Infinite horizontal marquee (CSS; pause on `prefers-reduced-motion` — show static strip). Wordmark lines rise in with Motion stagger.
- **Scroll:** Catalog section fades/slides once into view.
- **Hover:** Primary CTA fill brightens; catalog row accent flash on ink.
- **Reduced motion:** No marquee scroll; instant opacity; no scale taps.

## Layout notes

1. **First viewport:** mono micro-label row → full-bleed marquee → clipped `ARCD` display → one support line → sharp `INSERT COIN` CTA scrolling to `#catalog`. No illustration in the hero.
2. **Catalog:** "Cabinets" — indexed rows (`01` mono), empty state with small unDraw art as atmosphere only + "0 cabinets online."
3. **Chrome:** sticky header with ARCD mark; ThemeToggle + Auth unchanged.
4. **Atmosphere:** dark mode gets a subtle CRT vignette + hairline scan suggestion via CSS on `.vertical-games` (opacity low; disabled when reduced motion if animated).
5. **Copy:** arcade voice — cabinets, insert coin, after hours — not "floor" / "product stage."

## Imagery

Keep `public/games/art/undraw-gaming-controller.svg` (LICENSES.md) for empty-state
atmosphere only. Recolor via CSS filter toward phosphor if needed — do not
hand-draw replacements.

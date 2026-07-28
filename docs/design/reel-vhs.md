# Reel — design brief: "VHS / Video Nasty"

Design system for the `/movies` (Reel) vertical. Generated with the
`ui-ux-pro-max` skill (styles **#68 Vintage Analog / Retro Film** + **#11
Retro-Futurism**) and validated against its pre-delivery checklist. This is the
source of truth; components reference the semantic tokens, never raw hex.

## Direction

A late-night **video-store rental tape**. Dark-first, cinematic, neon-lit —
deliberately the opposite of the OSM "Editorial Logbook" warm-paper base (the
first Reel cut read too much like the main site). CRT scanlines, tape grain, a
glitchy chromatic-aberration wordmark, magenta + cyan neon.

## Tokens (both themes, WCAG-validated — see scratchpad validator)

| Token | Dark (primary) | Light ("video-store daylight") |
|-------|----------------|-------------------------------|
| `--paper` | `#0b0713` violet-black | `#e9e6f2` cool lilac-grey |
| `--surface` | `#150f24` | `#f5f3fb` |
| `--ink` | `#f3ecff` (17:1) | `#1a1327` (14.6:1) |
| `--muted` | `#baa9dc` (9.3:1) | `#4a3f63` (7.8:1) |
| `--faint` | `#8f7fb2` (5.5:1) | `#5c5178` (5.9:1) |
| `--rule` | `#2c2246` | `#cfc7e0` |
| `--accent` (magenta) | `#ff3d8b` | `#b81e6a` |
| `--accent-2` (cyan) | `#22e3e3` | `#0e6d8f` |
| `--accent-ink` | `#0b0713` | `#ffffff` |

Contrast floors met on **both** `--paper` and `--surface`: ink ≥12:1,
muted ≥6.5:1, faint/accent/accent-2 ≥4.5:1, accent-ink ≥4.5:1 on each neon.

## Type

- **Display** — Bebas Neue (tall condensed VHS-box marquee), titles/wordmark.
- **Body** — DM Sans (clean, legible, distinct from OSM's Newsreader serif).
- **Mono** — Space Mono (timecode / tracking-number chrome).

## The memorable idea

The **chromatic-aberration wordmark** (`.vhs-title` — magenta/cyan text-shadow
split, dark mode) + a full-surface **CRT scanline + neon-vignette wash**
(`.vertical-movies::after`). Neon glow helpers: `.neon-text`, `.neon-edge`.

## Checklist adherence (ui-ux-pro-max)

- SVG icons only — no emoji as structural icons (favorite = SVG heart).
- Every interactive element: `cursor-pointer`, a visible hover (150–300ms),
  and a focus ring (global `:focus-visible`).
- Contrast verified in **both** themes independently.
- Motion respects `prefers-reduced-motion`; the scanline wash is static.
- No raw hex in components — semantic tokens only.

# Reel — design brief: "Last Showing"

`/movies` vertical branded **Reel**. Full redesign — replaces the previous
**VHS / Video Nasty** look (Bebas, magenta/cyan, CRT scanlines, chromatic
aberration).

## Mood

**sodium lamps on wet asphalt after the last showing** — empty drive-in lot,
one-sheet type still burning, dusk in the sky, no tape hiss.

## Direction

**Name:** Last Showing  
**Why:** A watch log is a night at the pictures, not a video-store gimmick.
The old neon/VHS chrome read as a template. This room should feel like leaving
the lot when the credits are over.  
**Bold risk:** Clipped kinetic `REEL` that nearly exits the viewport; sodium
glow as atmosphere, **no scanlines, no chromatic split**. Radius **0**.  
**Hero archetype:** kinetic-type

## Anti-goals

- Not Editorial Logbook (warm paper / Fraunces / oxblood)
- Not previous Reel VHS (magenta/cyan / Bebas / CRT)
- Not ARCD Cabinet After Hours (phosphor green / marquee)
- Not Vault Blacklight Notary (indigo / wax pink)
- Not centered card-stack SaaS landing

## Type

| Role | Family | Role on page |
|------|--------|--------------|
| Display | **Anton** | One-sheet wordmark + titles |
| Body | **Outfit** | Support copy, notes, forms |
| Mono | **Red Hat Mono** | Lot codes, meta, filters |

## Token overrides (OSM Editorial defaults → Reel)

| Token | OSM light | OSM dark | This light | This dark |
|-------|-----------|----------|------------|-----------|
| `--paper` | `#efe7d6` | `#15120d` | `#e4e0d6` | `#0c0b09` |
| `--surface` | `#f8f2e4` | `#1d1811` | `#f1ece2` | `#171512` |
| `--ink` | `#241d12` | `#ece4d5` | `#16120e` | `#f3ece3` |
| `--muted` | `#574c39` | `#a0937f` | `#4d463c` | `#b8ad9c` |
| `--faint` | `#6a5e49` | `#8e8472` | `#6b6358` | `#8a8072` |
| `--rule` | `#d2c3a5` | `#322a1e` | `#c9c0b0` | `#2a2620` |
| `--accent` | `#8c2b1c` | `#db6a4a` | `#b45309` | `#ffb020` |
| `--accent-2` | — | — | `#1e4d6b` | `#7eb8d4` |
| `--accent-soft` | `#e6d6bc` | `#2a201a` | `#f0dcc0` | `#2a1c08` |
| `--accent-ink` | — | — | `#ffffff` | `#0c0b09` |
| `--display-family` | Fraunces | — | Anton | — |
| `--body-family` | Newsreader | — | Outfit | — |
| `--mono-family` | JetBrains Mono | — | Red Hat Mono | — |

**Radius:** `0` — ticket stock, not pills.

## Motion

- **Hero:** Wordmark rises from a clip; sodium field is static CSS (no WebGL).
- **Scroll:** Feature list / library fades once into view.
- **Hover:** Primary CTA inverts (fill ↔ outline); chips hairline to accent.
- **Reduced motion:** Instant opacity; no rise.

## Layout notes

1. **Landing:** mono lot row → clipped `REEL` → one line of copy → sharp Google CTA. No feature-icon grid; three numbered rows.
2. **Logged-in home:** same type language; library + filters stay, restyled sharp.
3. **Chrome:** sticky header with Anton mark + “Last showing”; kill `●REC` / VHS copy.
4. **Atmosphere:** dark mode gets a low sodium/dusk radial glow — **no CRT**.
5. **Copy:** lot, showing, one-sheet — not tape, tracking error, or video nasty.

## What must not change (product)

TMDB search, logging, ratings, follows, public handles, wrapped, share cards —
shell and tokens only.

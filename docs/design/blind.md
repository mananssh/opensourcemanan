# Blind — design brief: "Redacted Signal"

`/games/blind` — first live ARCD cabinet. Pass-and-play Undercover / Impostor.
Nested under `/games` but **does not inherit** Cabinet After Hours look.

## Mood

**redacted group-chat at 2am** — phone face-down on the table, black bars over
the juicy bits, one hot signal that someone is lying.

## Direction

**Name:** Redacted Signal  
**Why:** Blind is about a shared secret and a wrong twin — UI should feel like
censorship + accusation, not a cabinet or a movie night.  
**Bold risk:** Full-bleed **kinetic redaction** — oversized display type with
animated black bars that swipe across letters; pass-phone phases go nearly empty
(one name, one word, one CTA).  
**Hero archetype:** kinetic type

## Anti-goals

- Not Editorial Logbook (warm paper / Fraunces / oxblood)
- Not ARCD Cabinet After Hours (phosphor / marquee / Big Shoulders)
- Not Reel Last Showing (sodium / Anton)
- Not Vault Blacklight Notary
- Not purple/indigo SaaS gradients or centered card-stack heroes

## Type

| Role | Family | Role on page |
|------|--------|--------------|
| Display | **Archivo Black** | BLIND wordmark, phase titles, secret word |
| Body | **Outfit** | Instructions, setup forms |
| Mono | **IBM Plex Mono** | Phase indexes, PASS DEVICE, pair meta |

Fonts wired in `app/games/blind/layout.tsx`.

## Token overrides (OSM Editorial → Blind)

| Token | OSM light | OSM dark | This light | This dark |
|-------|-----------|----------|------------|-----------|
| `--paper` | `#efe7d6` | `#15120d` | `#f4f1ec` | `#07070a` |
| `--surface` | `#f8f2e4` | `#1d1811` | `#ebe6df` | `#12121a` |
| `--ink` | `#241d12` | `#ece4d5` | `#0c0c10` | `#f3f0ea` |
| `--muted` | `#574c39` | `#a0937f` | `#5a5660` | `#9a96a3` |
| `--faint` | `#6a5e49` | `#8e8472` | `#8a8490` | `#6a6674` |
| `--rule` | `#d2c3a5` | `#322a1e` | `#d4cfc6` | `#2a2a36` |
| `--accent` | `#8c2b1c` | `#db6a4a` | `#e11d48` | `#ff2d55` |
| `--accent-2` | — | — | `#0d9488` | `#2ee6c7` |
| `--accent-soft` | `#e6d6bc` | `#2a201a` | `#fce7ec` | `#2a1018` |
| `--accent-ink` | — | — | `#ffffff` | `#07070a` |
| `--display-family` | Fraunces | — | Archivo Black | — |
| `--body-family` | Newsreader | — | Outfit | — |
| `--mono-family` | JetBrains Mono | — | IBM Plex Mono | — |

### Bridge + charts

| Token | Light | Dark |
|-------|-------|------|
| `--background` / `--foreground` | paper / ink | paper / ink |
| `--primary` / `--primary-foreground` | accent / accent-ink | accent / accent-ink |
| `--secondary` / `--secondary-foreground` | accent-soft / ink | accent-soft / ink |
| `--muted-foreground` | muted | muted |
| `--destructive` | `#b42318` | `#ff6b6b` |
| `--border` / `--input` / `--ring` | rule / rule / accent | same |
| `--chart-1`…`5` | accent, accent-2, muted rose/teal | bright signal set |

**Radius:** `0` — sharp redaction bars. No pills.

## Motion

- **Hero:** `BLIND` letters rise / clip-reveal; redaction bars slide across
  (`motion/react`). Pause bars when `prefers-reduced-motion`.
- **Phase transitions:** hard cut + short ink wipe (80–120ms).
- **Deal reveal:** word snaps in from behind a redaction bar; HIDE & PASS
  pulses once on accent.
- **Reduced motion:** static wordmark, no bar animation, instant phase swap.

## Layout notes

1. **Hub:** mono `01 · PASS-AND-PLAY` → kinetic `BLIND` → one support line →
   `PLAY` | `HOW IT WORKS`. Link back to ARCD.
2. **Setup / source / review / deal / hints / vote / end** — see product plan;
   thumb-first, ≥44px primary actions.
3. **Chrome:** Blind mark + kill session; ThemeToggle; no ARCD marquee.
4. **Atmosphere:** diagonal hash overlay on paper; dark void + hard accent
   rules. No CRT scanlines, no sodium wash.

## Pack / privacy (product note)

Default pack is static JSON. WhatsApp extract is one-shot; OSM does not store
chat or packs. Host downloads packs client-side.
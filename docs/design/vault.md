# Vault — design brief: "Blacklight Notary"

`/vault` is a private, single-owner encrypted document store. Full frontend
redesign — replaces the previous **Encrypted Archive** look (graphite steel,
brass dial, Chakra Petch, CRT scanlines).

## Mood

**wax seal under ultraviolet** — a notary desk after hours: indigo black paper,
crimson wax, UV verification lamp, engraved titles. Custody without cosplay
military console.

## Direction

**Name:** Blacklight Notary  
**Why:** The vault holds identity documents. It should feel like a sealed
ledger under blacklight — quiet authority, not a brass bank terminal and not a
phosphor arcade.  
**Bold risk:** **Kinetic type** hero — oversized clipped `VAULT` that nearly
exits the viewport; the working console sits *under* that typographic seal, not
beside a soft card stack. Radius **0** everywhere.  
**Hero archetype:** kinetic-type

## Anti-goals

- Not Editorial Logbook (warm paper / Fraunces / oxblood)
- Not previous Vault (steel + brass + Chakra Petch + CRT)
- Not ARCD Cabinet After Hours (phosphor green / marquee / Big Shoulders)
- Not Reel (VHS neon magenta/cyan / Bebas)
- Not rounded SaaS card grids / pill chips as the visual system

## Type

| Role | Family | Role on page |
|------|--------|--------------|
| Display | **Cinzel** | Engraved wordmark + section titles |
| Body | **Figtree** | UI copy, notes, dialogs |
| Mono | **Azeret Mono** | File codes, AES line, stats, chips |

## Token overrides (OSM Editorial → Vault)

| Token | OSM light | OSM dark | This light | This dark |
|-------|-----------|----------|------------|-----------|
| `--paper` | `#efe7d6` | `#15120d` | `#ebe6f2` | `#0c0814` |
| `--surface` | `#f8f2e4` | `#1d1811` | `#f7f4fc` | `#15101f` |
| `--ink` | `#241d12` | `#ece4d5` | `#1a1228` | `#f0e8ff` |
| `--muted` | `#574c39` | `#a0937f` | `#4a3f5c` | `#b5a5d0` |
| `--faint` | `#6a5e49` | `#8e8472` | `#6a5d7a` | `#8a7aa8` |
| `--rule` | `#d2c3a5` | `#322a1e` | `#d4cce0` | `#2a2238` |
| `--accent` | `#8c2b1c` | `#db6a4a` | `#8b1e4a` | `#ff5a8a` |
| `--accent-2` | — | — | `#4c1d95` | `#a78bfa` |
| `--accent-soft` | `#e6d6bc` | `#2a201a` | `#ead5e0` | `#2a1020` |
| `--accent-ink` | — | — | `#ffffff` | `#0c0814` |
| `--negative` | — | — | `#b42318` | `#ff7a72` |
| `--display-family` | Fraunces | — | Cinzel | — |
| `--body-family` | Newsreader | — | Figtree | — |
| `--mono-family` | JetBrains Mono | — | Azeret Mono | — |

**Radius:** `0` — stamped dossier edges, not soft cards.

## Motion

- **Hero:** Wordmark lines rise from a clip (`yPercent`-style) via Motion; mono
  custody labels fade after.
- **Scroll:** Dossier list / empty state fades once into view.
- **Hover:** Accent hairline on dossier row; star/download affordances tint to
  accent-2.
- **Reduced motion:** Instant opacity; no rise; no pulse on status.

## Layout notes

1. **First viewport:** mono custody row (`SEALED · AES-256 · OWNER`) → clipped
   kinetic `VAULT` → one custody sentence → sharp stat strip (no rounded tiles)
   → console (upload + search + dossiers).
2. **Dossiers:** Prefer **indexed rows** (or sharp rectangles) over cozy
   rounded card grids; keep actions (download / edit / delete / favorite).
3. **Upload:** Sharp dashed seal bay — “Drop to seal” language.
4. **Chrome:** Sticky header with Cinzel mark + UV status (accent-2), no CRT
   overlay (leave that to ARCD / Reel).
5. **Privacy non-negotiables unchanged:** `robots: noindex`, out of `siteNav`,
   `requireVaultOwner()` on layout/actions/APIs.

## What must not change (backend)

Crypto, access gating, upload/download APIs, schema, Fuse search behavior —
frontend shell only.

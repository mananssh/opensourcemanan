# Vault — "Encrypted Archive" design brief

The Vault (`/vault`) is a **private, single-owner** document store for sensitive
identity documents (Aadhaar, PAN, DL, …). It is the one vertical that is *not*
public-by-anything: only `VAULT_OWNER_EMAIL` can reach it, files are AES-256-GCM
envelope-encrypted before they touch storage, and the route is kept out of the
public site nav and search index. The design has to *feel* like that — a secure
terminal / bank-vault console, not the warm editorial OSM base.

## The one memorable idea

A **secure terminal console**: a graphite steel surface lit by a single brass
accent (the vault dial) with a verify-green "encrypted" signal. Documents are
**sealed dossiers** — mono file-codes, a lock glyph, an `AES-256` seal — that
read like classified records in a cabinet, not blog cards. The header carries a
live `ENCRYPTED · LOCAL-ONLY` status line. Nothing is playful; everything signals
custody and integrity.

## Palette (both themes, WCAG-validated)

Dark-first (the vault lives in the dark). Both themes validated with the repo's
relative-luminance script: **ink ≥ 12:1, muted ≥ 6.5:1, faint / accent / accent-2
≥ 4.5:1** on *both* `--paper` and `--surface`; `--accent-ink` ≥ 4.5:1 on the
accents.

### Dark — "vault interior"
| token | value | role |
|-------|-------|------|
| `--paper` | `#0a0c10` | graphite black, the cabinet |
| `--surface` | `#13171d` | brushed-steel panel |
| `--ink` | `#eef2f6` | etched label white |
| `--muted` | `#a4afbb` | secondary meta |
| `--faint` | `#78838f` | file-codes, timestamps |
| `--rule` | `#252c34` | hairline seams |
| `--accent` | `#e8b24a` | **brass dial** (the vault gold) |
| `--accent-2` | `#4ade80` | verify-green (`ENCRYPTED` signal) |
| `--accent-soft` | `#241d0e` | brass tint fill |
| `--accent-ink` | `#0a0c10` | dark text on brass/green |

### Light — "steel filing cabinet"
| token | value | role |
|-------|-------|------|
| `--paper` | `#e4e7ec` | cool brushed steel (never OSM kraft) |
| `--surface` | `#f2f4f7` | drawer-white panel |
| `--ink` | `#111620` | stamped ink |
| `--muted` | `#414b57` | secondary meta |
| `--faint` | `#525c68` | file-codes |
| `--rule` | `#c3cad3` | seams |
| `--accent` | `#8a5a05` | deep brass (AA on steel) |
| `--accent-2` | `#0d6f38` | verify-green (AA on steel) |
| `--accent-soft` | `#efe1c6` | brass tint |
| `--accent-ink` | `#ffffff` | text on accents |

## Type

Distinct from every other vertical (Reel = Bebas/DM Sans/Space Mono; OSM =
Fraunces/Newsreader/JetBrains).

- **Display** — `Chakra Petch` (a technical, semi-condensed grotesque; reads
  "secure console / defense-grade").
- **Body** — `IBM Plex Sans` (institutional, precise).
- **Mono** — `IBM Plex Mono` (file-codes, sizes, checksums, the status line).

Fonts load in `app/vault/layout.tsx` via `next/font/google` and map onto
`--display-family` / `--body-family` / `--mono-family`.

## Motion & effects (scoped to `.vertical-vault`, reduced-motion safe)

- A faint **scanline + vignette** on the dark surface (like Reel's CRT, dimmer)
  to sell the console.
- A one-shot **unlock** reveal when the dashboard mounts (brass sweep), 200–300ms,
  disabled under `prefers-reduced-motion`.
- The `ENCRYPTED` status dot pulses the verify-green (motion-safe only).
- Document seals lift on hover with a brass hairline; focus states are a solid
  brass ring (keyboard parity).

## Non-negotiables (pre-delivery checklist)

- SVG icons only (lock, shield, download, seal) — never emoji.
- 4.5:1 contrast in **both** themes, validated.
- All motion 150–300ms and gated behind `motion-safe`.
- Visible focus ring on every interactive element.
- `robots: noindex`; never in `siteNav`; every route/action/API behind
  `requireVaultOwner()`.

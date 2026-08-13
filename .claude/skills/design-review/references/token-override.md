# OSM token override checklist

`:root` / `.dark` ship the **Editorial Logbook** defaults. A new vertical
**must** redefine these under `.vertical-<name>` and `html.dark .vertical-<name>`.
Leaving a cell blank means the Editorial look leaks through — that is a bug.

Fill every **core** row. Fill **extended** rows when the surface uses charts,
shadcn primitives, or a second accent.

## Core semantic tokens (always override)

| Token | Role | OSM light default | OSM dark default | This light | This dark |
|-------|------|-------------------|------------------|------------|-----------|
| `--paper` | Page canvas (`bg-paper`) | `#efe7d6` | `#15120d` | | |
| `--surface` | Raised panels (`bg-surface`) | `#f8f2e4` | `#1d1811` | | |
| `--ink` | Primary text (`text-ink`) | `#241d12` | `#ece4d5` | | |
| `--muted` | Secondary text | `#574c39` | `#a0937f` | | |
| `--faint` | Tertiary / timestamps | `#6a5e49` | `#8e8472` | | |
| `--rule` | Borders / hairlines | `#d2c3a5` | `#322a1e` | | |
| `--accent` | Brand / CTA | `#8c2b1c` | `#db6a4a` | | |
| `--accent-soft` | Soft accent wash | `#e6d6bc` | `#2a201a` | | |
| `--display-family` | Display type | Fraunces | (same) | | |
| `--body-family` | Body type | Newsreader | (same) | | |
| `--mono-family` | Mono / meta | JetBrains Mono | (same) | | |

Optional but common on strong verticals:

| Token | Role | Notes |
|-------|------|-------|
| `--accent-2` | Second accent (neon, verify, etc.) | Invent if mood needs two signals |
| `--accent-ink` | Text on solid accent fills | Must contrast on `--accent` |

## Type wiring

In the vertical layout (`app/<route>/layout.tsx`):

1. Load faces via `next/font` (or justified CDN).
2. Expose them as CSS vars on the wrapper (e.g. `--font-syne`).
3. Point `--display-family` / `--body-family` / `--mono-family` at those vars
   inside `.vertical-<name>`.

**Do not** leave Fraunces + Newsreader + JetBrains as the stack for a new
vertical. Those are Editorial. Invent again.

## Extended / shadcn bridge (when using UI kit or charts)

Set these so shared components don't fall back to root:

| Token | Typical mapping |
|-------|-----------------|
| `--background` | `var(--paper)` |
| `--foreground` | `var(--ink)` |
| `--primary` | `var(--accent)` |
| `--primary-foreground` | `var(--accent-ink)` |
| `--secondary` | `var(--accent-soft)` or a custom surface |
| `--secondary-foreground` | `var(--ink)` |
| `--muted-foreground` | `var(--muted)` |
| `--destructive` | mood-matched danger |
| `--border` / `--input` / `--ring` | `var(--rule)` / accent |
| `--chart-1` … `--chart-5` | mood palette |
| `--chart-background` / `--chart-foreground` | surface / ink |

## Radius

OSM does not force a global radius token on every vertical. Declare intent in
the brief:

- Default craft bias (motion-frontend): **`0` or near-zero**
- Soft/toy moods: say so and set explicit radii in components or a
  `--radius` if the vertical uses shadcn

## Contrast

Both themes must hold readable contrast (aim AA for ink/muted/accent on paper).
Do not invent a dark mode by only inverting lightness — redesign the dark
atmosphere for the same mood.

## Implementation sketch

```css
.vertical-<name> {
  --paper: …;
  --surface: …;
  --ink: …;
  --muted: …;
  --faint: …;
  --rule: …;
  --accent: …;
  --accent-soft: …;
  --accent-ink: …; /* if needed */
  --accent-2: …;    /* if needed */
  --display-family: var(--font-…);
  --body-family: var(--font-…);
  --mono-family: var(--font-…);
  /* bridge + charts as needed */
}

html.dark .vertical-<name> {
  /* full dark set — invent, don't only invert */
}
```

Apply `className="vertical-<name> …"` on the vertical layout shell (ADR 0010).

# Geetdle — design brief: "Quiet Marquee"

`/games/geetdle` — daily guessing game for Bollywood songs.
Nested under `/games` but **does not inherit** Cabinet After Hours or Blind look.

> **Revision (2026-11-11):** The original "Mumbai Nights" brief (saturated
> magenta/purple jewel tones splashed across every surface) was replaced with an
> Apple-minimalist system at the user's request. The restraint comes from the
> canvas, not the subject — colour now lives only in the feedback tiles and the
> single CTA, which reads more premium and keeps the six-category grid legible.

## Mood

**a dark cinema before the reel starts** — a near-silent off-white / true-black
canvas, hairline rules, one confident crimson accent. Restrained, precise,
unmistakably a daily ritual. The Bollywood warmth is carried by the content
(song titles, eras, singers) rather than by loud chrome.

## Direction

**Name:** Geetdle (गीत = "song" in Hindi)  
**Why:** A daily puzzle people return to should feel calm and fast, not noisy.
Apple-grade minimalism — generous whitespace, huge clean display type, pill
controls, subtle motion — with a single saturated accent for intent.  
**Bold risk:** near-monochrome canvas (`#fbfbfd` / `#000`) with exactly ONE
crimson accent (`#e11d48` / `#ff375f`) used sparingly; feedback tiles are the
only place colour appears in force (green exact · amber close · neutral wrong).  
**Hero archetype:** oversized kinetic wordmark over a quiet canvas.

## Palette

| Token | Light | Dark | Role |
|-------|-------|------|------|
| `--paper` | `#fbfbfd` | `#000000` | Canvas |
| `--surface` | `#f3f3f6` | `#1c1c1e` | Cards, input, neutral tiles |
| `--ink` | `#1d1d1f` | `#f5f5f7` | Primary text |
| `--muted` / `--faint` | `#6e6e73` / `#a1a1a6` | `#a1a1a6` / `#6e6e73` | Secondary / mono labels |
| `--accent` | `#e11d48` | `#ff375f` | CTA, links, focus ring — **used sparingly** |
| `--success` (exact) | `#2a9d5c` | `#30d158` | Exact-match tile |
| `--partial` (close) | `#d9a200` | `#ffd60a` | Close-match tile |
| `--wrong` | `#d6d6db` | `#3a3a3c` | Wrong tile (neutral, not loud) |

## Anti-goals

- Not ARCD Cabinet After Hours (phosphor green / arcade CRT)
- Not Blind Redacted Signal (void + hard accusation)
- Not OSM Editorial (warm amber/sepia/cream)
- Not the old "Mumbai Nights" (jewel tones everywhere — too loud for a daily ritual)
- Not colour in the chrome — accent is reserved for intent (CTA + feedback tiles)

## Type

| Role | Family | Role on page |
|------|--------|--------------|
| Display | **Poppins** (700, 800) | Game logo, song titles, category headers |
| Body | **Inter** (400, 500) | Instructions, song search input |
| Mono | **JetBrains Mono** | Year feedback, guess counter |

Fonts wired in `app/games/geetdle/layout.tsx`.

**Rationale:** Poppins has the warmth and geometric clarity that works for both 
Hindi and English transliterations; Inter for excellent readability; JetBrains 
Mono for the puzzle mechanics.

## Token overrides (OSM Editorial → Geetdle "Mumbai Nights")

| Token | OSM light | OSM dark | Geetdle light | Geetdle dark |
|-------|-----------|----------|---------------|--------------|
| `--paper` | `#efe7d6` | `#15120d` | `#faf5ff` | `#0a0118` |
| `--surface` | `#f8f2e4` | `#1d1811` | `#fdf4ff` | `#1a0a2e` |
| `--ink` | `#241d12` | `#ece4d5` | `#1a0033` | `#f5e6ff` |
| `--muted` | `#574c39` | `#a0937f` | `#6b21a8` | `#c084fc` |
| `--faint` | `#6a5e49` | `#8e8472` | `#9333ea` | `#a78bfa` |
| `--rule` | `#d2c3a5` | `#322a1e` | `#e9d5ff` | `#2e1065` |
| `--accent` | `#8c2b1c` | `#db6a4a` | `#db2777` | `#f472b6` |
| `--accent-2` | — | — | `#059669` | `#34d399` |
| `--accent-soft` | `#e6d6bc` | `#2a201a` | `#fce7f3` | `#4a044e` |
| `--accent-ink` | — | — | `#ffffff` | `#0a0118` |
| `--display-family` | Fraunces | — | Poppins | — |
| `--body-family` | Newsreader | — | Inter | — |
| `--mono-family` | JetBrains Mono | — | JetBrains Mono | — |

**Color story:**
- **Light theme:** Soft lavender paper (`#faf5ff`) with hot pink accent (`#db2777`), 
  evoking hand-painted vintage Bollywood posters with electric marquee lights
- **Dark theme:** Deep purple void (`#0a0118`) with pink accent (`#f472b6`), 
  like Mumbai night streets with neon cinema signs and monsoon reflections
- **Emerald green** as secondary accent for variety and energy
- **Purple as base** instead of OSM's warm browns — completely distinct identity

### Bridge + charts

| Token | Light | Dark |
|-------|-------|------|
| `--background` / `--foreground` | paper / ink | paper / ink |
| `--primary` / `--primary-foreground` | accent / accent-ink | accent / accent-ink |
| `--secondary` / `--secondary-foreground` | accent-soft / ink | accent-soft / ink |
| `--muted-foreground` | muted | muted |
| `--success` | `#059669` | `#34d399` |
| `--partial` | `#f59e0b` | `#fbbf24` |
| `--wrong` | `#6b7280` | `#4b5563` |
| `--destructive` | `#dc2626` | `#f87171` |
| `--border` / `--input` / `--ring` | rule / rule / accent | same |

**Radius:** `0.5rem` — more pronounced roundness for a softer, more playful feel 
that contrasts with OSM's sharper editorial aesthetic.

## Motion

- **Hero:** Gentle fade-in for daily puzzle reveal; category tiles slide up 
  sequentially (50ms stagger)
- **Guess submission:** Tile flips with 200ms ease for feedback reveal 
  (green/yellow/gray)
- **Song reveal:** Song title + poster fade in together before tiles (150ms)
- **Poster reveal:** Poster fades in at guess threshold with soft scale (0.95 → 1)
- **Reduced motion:** Instant tile reveal, no stagger, no scale

## Layout notes

1. **Hub:** `GEETDLE` wordmark → tagline → daily puzzle number → PLAY
2. **Game board:**
   - **Each guess row:** Song title + thumbnail → Category tiles
   - Category columns: Music Director | Singer(s) | Year | Movie | Language | Genre
   - Guess input: Autocomplete search with song titles
   - Feedback tiles: 🟩 exact match, 🟨 partial/close, ⬜ wrong (↑↓ for year)
   - Full poster reveals after X guesses (e.g., 3 or 5)
3. **Chrome:** Game mark + daily streak; ThemeToggle; link to All Games
4. **Share results:** Emoji grid copy-to-clipboard with puzzle number
5. **Atmosphere:** Purple-to-pink gradient overlay in light; deep purple-to-magenta 
   in dark; subtle noise texture for film grain feel

## Game mechanics (product note)

- Daily puzzle rotation from `songs.json`
- Categories shown from start (no hidden info)
- Unlimited guesses OR 6-guess hard mode (future)
- Autocomplete input for song titles (fuzzy match)
- **Each guess shows: Song title + thumbnail before category tiles**
- Share results as emoji grid (🟩🟨⬜ pattern)
- Poster metadata: use YouTube thumbnail from dataset

## Data structure

Song schema:
```typescript
{
  song_title: string;
  movie: string;
  music_director: string;
  singers: string; // comma-separated
  year: number;
  language: string;
  genre: string;
  youtube_url: string;
  popularity_score?: number;
}
```

Match logic:
- **Music Director:** exact match (case-insensitive)
- **Singer(s):** partial match if any singer matches
- **Year:** exact = 🟩, ±1 = 🟨 with ↑↓, else ⬜ with ↑↓
- **Movie:** exact match
- **Language:** exact match
- **Genre:** exact match

## Name etymology

**Geetdle** = "Geet" (गीत, Hindi for "song") + "-dle" (daily puzzle suffix)
Pronunciation: GEET-dle (like "Wordle" but with "geet")

# Geetdle — Daily Bollywood Song Guessing Game

**गीत** (geet) = "song" in Hindi

Daily Bollywood song guessing game built for the OSM games vertical.

## Overview

**Geetdle** is a daily puzzle game where players guess Bollywood songs from category clues. Categories are shown from the start, and feedback is provided for each guess using colored tiles.

- **Route**: `/games/geetdle`
- **Status**: Live
- **Access**: Public
- **Design**: "Mumbai Nights" theme (vibrant jewel tones, electric Bollywood)

## Game Mechanics

### Categories
- **Music Director**: Exact match
- **Singer(s)**: Exact (all match) or Partial (any match)
- **Year**: Exact, ±1 year (partial), or wrong with direction (↑↓)
- **Movie**: Exact match
- **Language**: Exact match (Hindi, Punjabi, etc.)
- **Genre**: Exact match (Romantic, Ghazal, Sufi, etc.)

### Feedback
- 🟩 **Green (Exact)**: Perfect match
- 🟨 **Yellow (Partial)**: Close match (±1 year or partial singer match)
- ⬜ **Gray (Wrong)**: No match (↑↓ shows year direction)

### Features
- Daily puzzle rotation (new song every day)
- Autocomplete song search with fuzzy matching
- Movie poster reveal after 3 guesses
- Shareable emoji grid results
- Light & dark theme support
- Unlimited guesses (no hard mode yet)

## Dataset

**Source**: the private `geetdle_songs` table (DB only — nothing ships in the repo).
- Crawled from JioSaavn (title, year, language, play count, movie, music
  director, singers, album art). Crawl JSON is gitignored.
- Genre is **inferred** from the song title (JioSaavn has no genre field).
- Album art (`poster_url`) is the poster hint, revealed after 3 guesses.
- Daily answer picked server-side; see `lib/games/geetdle/queries.ts`.

## Architecture

Following the games vertical architecture pattern:

### File Structure
```
app/games/geetdle/
  layout.tsx          # Fonts, branding, header
  page.tsx            # Entry point

lib/games/geetdle/
  types.ts            # TypeScript types
  rules.ts            # Game logic (match checking, daily song)
  data.ts             # Data loading & enrichment

components/games/geetdle/
  geetdle-app.tsx     # Main game component
  game-board.tsx      # Category grid & poster
  guess-input.tsx     # Autocomplete search input
  share-modal.tsx     # Results sharing modal

content/games/geetdle/
  songs.json          # Song dataset

docs/design/
  geetdle.md  # Design brief
```

### Styling

**Vertical**: `.vertical-geetdle` (in `app/globals.css`)

**Fonts**:
- Display: Poppins (700) - wordmark, song titles
- Body: Inter - instructions, UI text
- Mono: JetBrains Mono - puzzle number, counters

**Colors** (light theme):
- Paper: `#fef8f0` (warm cream)
- Accent: `#d97706` (amber)
- Success: `#16a34a` (green)
- Partial: `#eab308` (yellow)
- Wrong: `#94a3b8` (gray)

**Colors** (dark theme):
- Paper: `#0f0a08` (deep coffee)
- Accent: `#fbbf24` (golden yellow)
- Success: `#4ade80` (bright green)
- Partial: `#fde047` (bright yellow)
- Wrong: `#475569` (slate)

### State Management

Client-side React state (no database):
- `useState` for phase tracking, guesses, win state
- Daily song calculated from date-based index
- Share results via clipboard API

## Daily Puzzle Logic

Daily song selection uses deterministic rotation:
```typescript
const epoch = new Date("2024-01-01T00:00:00Z");
const daysSinceEpoch = Math.floor((now - epoch) / (1000 * 60 * 60 * 24));
const songIndex = daysSinceEpoch % totalSongs;
```

This ensures:
- Same puzzle for all users on the same day
- Predictable rotation through the dataset
- No server-side state needed

## Future Enhancements

Potential additions (not yet implemented):
- [ ] Hard mode (6 guess limit)
- [ ] Streak tracking (localStorage)
- [ ] Stats dashboard (attempts distribution)
- [ ] Hint system (reveal one category)
- [ ] Era filter (50s-60s, 70s-80s, 90s-00s, 10s-20s)
- [ ] Multiplayer mode (share custom puzzles)
- [ ] Audio preview (30-second clip from YouTube)
- [ ] Larger dataset (expand to 365+ songs)

## Development

### Local Testing
```bash
npm run dev
# Visit http://localhost:3000/games/geetdle
```

### Build
```bash
npm run build
# Route appears as: ├ ○ /games/geetdle
```

### Adding Songs

To expand the dataset:
1. Edit `content/games/geetdle/songs.json`
2. Follow the schema:
   ```json
   {
     "song_title": "Song Name",
     "movie": "Movie Name",
     "music_director": "Director Name",
     "singers": "Singer 1, Singer 2",
     "year": 2024,
     "youtube_url": "https://www.youtube.com/watch?v=...",
     "popularity_score": 5.0
   }
   ```
3. Language and genre are auto-inferred by `lib/games/geetdle/data.ts`

### Customization

**Change poster unlock threshold**:
```typescript
// In geetdle-app.tsx
const POSTER_UNLOCK_THRESHOLD = 3; // Change to desired number
```

**Modify match logic**:
```typescript
// In lib/games/geetdle/rules.ts
// Edit checkGuess(), matchSingers(), matchYear() functions
```

## Design Principles

Per ADR 0006 (design-first workflow):
- ✅ Design brief created first (`docs/design/geetdle.md`)
- ✅ Unique visual identity (not copying ARCD or Blind)
- ✅ Both light & dark themes implemented
- ✅ Semantic tokens (no hardcoded colors)
- ✅ Reduced motion support
- ✅ Mobile-first responsive design

## Credits

- **Dataset**: crawled from JioSaavn into a private DB table (not in the repo)
- **Design**: "Quiet Marquee" theme by OSM
- **Architecture**: Following OSM games vertical pattern
- **Fonts**: Google Fonts (Poppins, Inter, JetBrains Mono)

---

**Play now**: [/games/geetdle](/games/geetdle)

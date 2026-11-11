# Geetdle Transformation — Complete Changelog

## Summary

Successfully renamed and redesigned "Bollywood Stumple" to "Geetdle" with a BOLD new "Mumbai Nights" aesthetic that's completely distinct from OSM's main branding.

## Changes Made

### 1. Renamed Everything
- ✅ Game name: "Bollywood Stumple" → "Geetdle" (गीत = "song" in Hindi)
- ✅ Route: `/games/bollywood-stumple` → `/games/geetdle`
- ✅ CSS class: `.vertical-bollywood-stumple` → `.vertical-geetdle`
- ✅ Component: `StumpleApp` → `GeetdleApp`
- ✅ Type: `StumplePhase` → `GeetdlePhase`
- ✅ CSS class: `.stumple-wordmark` → `.geetdle-wordmark`
- ✅ Font variable: `--font-inter-stumple` → `--font-inter-geetdle`

### 2. Complete Design System Overhaul

**Theme: "Mumbai Nights"** — Electric jewel tones inspired by vintage Bollywood posters and neon cinema signs

**Color Philosophy**: BOLD, vibrant, unapologetically different from OSM's warm editorial

#### Light Theme
- Background: `#faf5ff` (soft lavender) ← was warm cream
- Accent: `#db2777` (hot pink) ← was amber
- Success: `#059669` (emerald) ← was lime green
- Ink: `#1a0033` (deep purple) ← was brown

#### Dark Theme
- Background: `#0a0118` (deep purple void) ← was coffee
- Accent: `#f472b6` (bright pink) ← was gold
- Success: `#34d399` (mint green) ← was lime
- Ink: `#f5e6ff` (lavender) ← was cream

#### Key Differences from OSM
- OSM: Warm (amber, sepia, cream, browns)
- Geetdle: Cool jewel tones (purple, pink, emerald)
- OSM: Subtle, editorial, literary
- Geetdle: Electric, cinematic, maximalist

### 3. Enhanced Guess UI

**Before**: Just category tiles in a grid
**Now**: Song info card ABOVE category tiles

Each guess row shows:
```
┌─────────────────────────────────┐
│ 🎵  Song Title                   │
│     Guess #1                     │
└─────────────────────────────────┘
┌──────┬──────┬──────┬──────┬──────┬──────┐
│ Tile │ Tile │ Tile │ Tile │ Tile │ Tile │
└──────┴──────┴──────┴──────┴──────┴──────┘
```

- Song thumbnail (🎵 placeholder for now, can be enhanced with actual YouTube thumbnails)
- Song title (Poppins font, prominent)
- Guess number
- Category feedback tiles below

### 4. OSM Branding

- ✅ Footer: "opensourcemanan" → "OSM"
- ✅ All documentation references updated

### 5. Files Changed

#### Renamed Directories
- `app/games/bollywood-stumple/` → `app/games/geetdle/`
- `components/games/bollywood-stumple/` → `components/games/geetdle/`
- `lib/games/bollywood-stumple/` → `lib/games/geetdle/`
- `content/games/bollywood-stumple/` → `content/games/geetdle/`

#### Renamed Files
- `stumple-app.tsx` → `geetdle-app.tsx`

#### Updated Files
- ✅ `app/globals.css` — new `.vertical-geetdle` with jewel tone palette
- ✅ `app/games/geetdle/layout.tsx` — metadata, fonts, branding
- ✅ `app/games/geetdle/page.tsx` — import path
- ✅ `components/games/geetdle/geetdle-app.tsx` — wordmark, imports
- ✅ `components/games/geetdle/game-board.tsx` — song info cards, imports
- ✅ `components/games/geetdle/guess-input.tsx` — import path
- ✅ `lib/games/registry.ts` — slug, title
- ✅ `lib/games/geetdle/types.ts` — GeetdlePhase type
- ✅ `lib/games/geetdle/data.ts` — import path
- ✅ `lib/games/geetdle/README.md` — all references
- ✅ `docs/design/geetdle.md` — new design brief (created)
- ✅ `docs/design/bollywood-stumple.md` → kept as .old for reference

### 6. Build Verification

✅ `npm run build` succeeded
✅ Route appears as: `├ ○ /games/geetdle`
✅ No TypeScript errors
✅ No remaining references to old naming

## Visual Identity

### Before: "Cinematic Gold"
- Warm, vintage, amber-to-rose
- Similar to OSM's editorial aesthetic
- **Problem**: Not distinctive enough

### After: "Mumbai Nights"
- Electric, vibrant, purple-to-pink
- Jewel tones (magenta, purple, emerald)
- **Impact**: Completely different visual world from OSM

## What to Test

1. Visit `/games/geetdle` and verify:
   - Purple/pink gradient overlay visible
   - "GEETDLE" wordmark shows correctly
   - Game plays normally
   - Song info cards appear above category tiles
   - Colors feel BOLD and distinct
   - Footer says "OSM"

2. Toggle dark mode:
   - Deep purple background
   - Pink accent color
   - Mint green success tiles

## Next Steps (Optional Enhancements)

- [ ] Add real YouTube thumbnails to song info cards (extract from guess song's youtube_url)
- [ ] Add film grain texture overlay for vintage cinema feel
- [ ] Enhance animations (tile flips, song card fade-ins)
- [ ] Add Devanagari subtitle: गीतdle
- [ ] Share card with purple/pink branding

---
type: feat
summary: Grow the Geetdle catalog from JioSaavn and gate answers by real popularity
---

Adds a targeted JioSaavn crawler (`scripts/crawl-jiosaavn.mjs`) that pulls
popular Hindi Bollywood songs with their play counts, and reworks the seed to
use that signal: each crawled song's `play_count` is merged onto the matching
base catalog row, JioSaavn-only songs are added as extra searchable guesses, and
a song is answer-eligible only when it has a genre AND a play_count above a
threshold. This replaces the static top-1000 eligibility list with a real
popularity gate, so daily answers are genuinely well-known. All source/crawl
files stay gitignored — the catalog lives only in the DB.

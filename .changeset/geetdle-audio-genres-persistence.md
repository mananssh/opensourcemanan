---
type: feat
summary: Geetdle — audio preview, accurate genres, 8-guess limit, Nov 1 launch, saved progress
---

A batch of Geetdle gameplay and data upgrades.

- **Audio preview hint.** After 3 incorrect guesses, a 20-second preview of the
  answer's track plays (JioSaavn's `encrypted_media_url`, DES-decrypted to a
  direct stream at crawl time and stored as `audio_url`). Migration 0021 adds the
  column.
- **Hint ladder + guess limit.** Audio unlocks after 3 misses, the **song
  poster** (renamed from "movie poster", now square album art) after 7, and the
  game ends after the **8th** miss with the answer revealed. Sharing works on a
  loss too (it no longer claims a win).
- **Accurate genres.** Genres are no longer keyword-guessed from the title — the
  whole catalog is classified by actual musical style (so e.g. *Allah Maaf Kare*
  is Dance/Party, not Devotional). The seed applies a `song_uuid → genre`
  override map; keyword inference remains only as a fallback.
- **Launch numbering.** Puzzle #1 is **2026-11-01**; there are no puzzles before
  it. The number is computed from the UTC date so the client and server always
  agree (puzzles roll over at 00:00 UTC).
- **Saved progress.** Per-puzzle progress (guesses, win/loss, revealed hints, the
  answer) is persisted to `localStorage`, so a refresh mid-game or after solving
  restores the exact state. Per-device; degrades safely when storage is blocked.

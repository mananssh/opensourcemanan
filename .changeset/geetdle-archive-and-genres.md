---
type: feat
summary: Add a Geetdle archive to replay past puzzles, and infer genres for crawled songs
---

Two additions to Geetdle:

- **Play past puzzles.** A new `/games/geetdle/archive` index lists every prior
  daily puzzle, and `/games/geetdle/[puzzle]` plays a specific one. The daily
  answer is deterministic by puzzle number, so the game component and guess API
  now take a `puzzle` parameter (clamped to 1..today — you can replay the past,
  not the future). An "Archive" link sits in the game header.
- **Genre inference.** JioSaavn-crawled songs arrive without a genre; a
  word-boundary keyword classifier (`scripts/lib/geetdle-genre.mjs`) now assigns
  one during seeding using the same genre vocabulary as the tagged base, so every
  song has a sensible genre clue (and popular crawled songs can become answers).

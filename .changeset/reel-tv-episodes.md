---
type: feat
summary: Reel — track TV seasons & episodes with per-episode progress
---

TV shows are now first-class in Reel. When you log a series, Reel snapshots its
season and episode counts from TMDB, and each show gets an episode-progress
tracker on the dashboard: a progress bar plus −/＋1 steppers to mark how many
episodes you've watched. Reaching the final episode auto-flips the show to
"watched" (and stamps the date); any partial progress marks it "watching".

- **Schema**: `watch_entries` gains `seasonsTotal`, `episodesTotal`,
  `episodesWatched` (movies leave them null/0).
- **TMDB**: `getTitle` now returns `number_of_seasons` / `number_of_episodes`
  for TV, snapshotted onto the entry at add time.
- **Hours-watched is now accurate for TV** — counted as per-episode runtime ×
  episodes watched, instead of a single episode's runtime.
- **Public profiles** show an `X/Y ep` badge on in-progress series posters.

Ownership-checked like every other write; episode counts are clamped to the
show's total.

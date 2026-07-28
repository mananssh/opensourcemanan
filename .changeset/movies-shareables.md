---
type: feat
summary: Reel Phase 3 — activity calendar, richer stats, ticket-stub shareables & a Wrapped recap
---

The final phase of the Reel tracker turns the logged data into something worth
showing off.

**Richer stats** (surface on both the dashboard and public profiles):

- **Watch activity calendar** — a GitHub-style 12-month heatmap built from
  `watchedOn`, shaded with the accent token so it themes in light and dark.
- **Streaks** — longest run of consecutive logging days (and active-days count).
- **Ratings histogram** — the ½-star distribution folded into 1–5★ buckets.
- **Now-watching shelf** — an at-a-glance row of in-progress titles.

**Shareables** (the Instagram-story moment):

- **Ticket-stub cards** via `next/og` at `/movies/<handle>/share/<story|square>`
  — 1080×1920 and 1080×1080 PNGs rendered in the 35mm aesthetic (sprocket rail,
  poster collage, perforated stat divider, serial number). Public by design.
- **Wrapped recap** at `/movies/<handle>/wrapped` — a Spotify-Wrapped-style
  scroll of animated cards (titles, hours, top genre, average rating,
  highlights), with on-load motion that respects `prefers-reduced-motion`.
- A **share bar** on profiles (copy link + open either card) plus a Wrapped link.

All stats math lives in the existing pure `lib/movies/stats.ts` (no DB coupling);
the OG routes read the same public profile data. Replaces the earlier one-off
copy-link with the richer share bar. No new dependencies.

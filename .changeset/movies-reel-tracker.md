---
type: feat
summary: add Reel — a multi-user movie & TV tracker vertical (Phase 1)
---

Reel is a new vertical at `/movies`: a retro, ticket-stub-themed logbook where
any signed-in Google user tracks the films and shows they watch. This is the
repo's first **multi-user** feature — until now the site was owner-vs-everyone
(NextAuth JWT, no user table). Reel introduces a lightweight identity layer
(`watchers`, provisioned on first sign-in, addressed by a unique `@handle`) and
the repo's first **per-row ownership** authorization: every write is checked
against the current viewer, not the `OWNER_EMAILS` gate.

Phase 1 (this PR) — the personal tracker:

- **Low-friction logging**: search TMDB, tap a result, it's logged as watched
  (one tap = the habit). Rate with ½-star precision, set status
  (watched / watching / watchlist), add a note, favorite, delete — all inline
  and optimistic.
- **Your box-office report**: hours watched, films vs shows, this-year count,
  average rating, top genres, decades, and records — computed live from your
  entries.
- **Public-by-link profiles** at `/movies/<handle>`: poster wall + stats,
  rendered entirely from denormalized data (no TMDB dependency), with email kept
  off every public payload. A "Share reel" copy-link is included.
- **35mm & Ticket Stub theme**: kraft-paper-and-ink light mode, a darkened-
  auditorium dark mode, one marquee-red accent; Oswald / Public Sans / Space
  Mono. Every color pair WCAG-validated (ink ≥12:1, muted ≥6.5:1, faint/accent
  ≥4.5:1 on both surfaces).

Infrastructure reused, not rebuilt: the TMDB client mirrors the Tavily
external-API + DB-TTL-cache pattern (`movie_cache`), queries follow the blog's
`safeDb` + row→card shape, auth reuses NextAuth Google sign-in, and the vertical
is themed via the standard per-vertical token blocks (ADR 0005/0010).

Follow (find friends by exact `@handle`, friends homepage) and shareable
Instagram-story cards land in later phases. Requires a free `TMDB_API_KEY`
(see `.env.example`); with no key the vertical still renders and only search
degrades to empty.

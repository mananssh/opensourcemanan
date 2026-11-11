---
type: feat
summary: Move Geetdle to a private DB catalog with weighted daily answers
---

Redesign Geetdle (Apple-minimalist, mobile-responsive UI; richer share with a
link to the game) and move its song catalog into the shared database. Adds the
`geetdle_songs` table (migration 0019) and makes the game server-driven: the
daily answer is picked on the server, seeded by the puzzle number and weighted
75% toward songs from 2000 onward / 25% earlier; autocomplete and guess scoring
run as API routes so the answer and full catalog never reach the browser. The
static client-side song JSON is removed; an idempotent seed script loads the
catalog from gitignored source files (nothing ships in the repo).

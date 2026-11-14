---
type: feat
summary: Geetdle gameplay overhaul — direct-board onboarding, smarter hints, hover "Possibilities", instant client-side search
---

Reworks the Geetdle play experience:

- **Direct-board onboarding** — the separate "Play" gate is gone. Players land
  straight on the board with the clue columns visible, the search autofocused,
  and a greyed **EXAMPLE** row that teaches the colour legend and clears on the
  first real guess.
- **Smarter partial hints** — a new paler-amber tier joins the existing amber:
  Year now scores exact / within ±2 / same decade / wrong (with ↑↓); Genre
  scores exact / same genre-family (Romantic↔Sad, Dance↔Item↔Wedding,
  Devotional↔Qawwali, Classical↔Folk, Motivational↔Patriotic) / wrong.
- **"Language" clue dropped** — it was green on every guess (Hindi-only catalog);
  the board is now a tighter five columns.
- **Hover "Possibilities" panel** (Stumple-style) — after a guess, hovering a
  clue shows the values still consistent with all feedback plus an "N songs
  still possible" count. Computed client-side.
- **Instant search** — a lean, answer-free catalog ships to the client via a
  cached `/api/geetdle/catalog` route; autocomplete and the possibilities filter
  run locally, replacing the per-keystroke `/api/geetdle/search` round-trip. The
  daily answer is still picked and scored server-side.
- **On-board "How to read the clues"** legend.

Design brief: `docs/design/geetdle.md` (2026-11-15 revision).

---
type: refactor
summary: Geetdle — drop the MrAsacker dataset, make JioSaavn the sole catalog source
---

The MrAsacker base dataset is removed. JioSaavn is now the only source for the
Geetdle catalog.

- **Poster source.** MrAsacker was the only source of `youtube_url`, which fed
  the poster hint — so previously only base rows could be answers. We now capture
  JioSaavn's album art (`image`, upgraded to 500×500) into a new `poster_url`
  column and use it as the poster hint. Every crawled song has art, so the
  answer pool is no longer tied to the old base catalog.
- **Genre.** JioSaavn has no genre field, so genre is now fully inferred from the
  song title at seed time.
- **Eligibility.** A song is answer-eligible iff it has an (inferred) genre, a
  `play_count >= min-plays`, and a poster.
- **Migration 0020.** Adds `poster_url`; flips the `source` default to
  `jiosaavn`. The `youtube_url` column is kept (nullable) for optional later
  enrichment.
- Footer no longer credits the MrAsacker dataset.

The crawl JSON stays gitignored; the catalog lives only in the DB. Prod is
reseeded with `--force` after the migration applies.

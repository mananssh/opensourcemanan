---
type: feat
summary: redesign the blog index — featured hero, category chips, and clearer excerpts
---

The blog index rendered Featured and Latest with the same heavy `PostList`, and
that list's terminal `pb-28` padding left a ~190px gap that buried the category
tiles below it — so browsing by topic effectively disappeared.

Restructure the index around the four-axis rendering:

- **Category chips** (`components/blog/category-chips.tsx`) move to the masthead
  as compact accent-dotted pills, so topic browsing is the first thing in reach.
  Replaces the buried Spotify-style tiles (`category-tiles.tsx` removed).
- **Featured hero** (`components/blog/featured-hero.tsx`) — one spotlight post as
  a wide split card (cover image + copy), distinct from the Latest list so it no
  longer reads as a duplicate. Gracefully falls back to an accent gradient when a
  featured post has no cover. The hero post is pulled out of Latest so it doesn't
  repeat and pagination counts stay stable.
- **Excerpts** now render as a bordered italic pull-quote in both the hero and
  every `PostList` row, so it's unmistakably a snippet from the piece.
- `PostCard` gains `coverImageKey` (additive) so listings can show cover art.

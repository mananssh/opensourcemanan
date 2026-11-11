---
type: fix
summary: Fix Geetdle guess-dropdown footer overlap and missing posters
---

Two fixes:

- **Dropdown overlap.** The guess autocomplete lives inside `<main>` (z-10), the
  same z as the footer, which comes later in the DOM and so painted over the
  dropdown. Raise `<main>` to z-20 so the dropdown sits above the footer.
- **Missing posters.** The poster hint is the answer's YouTube thumbnail, but
  JioSaavn-crawled songs have no `youtube_url`, so when an answer was a crawled
  song (incl. in the archive) no poster appeared. Require a `youtube_url` for
  answer-eligibility, so every daily/archive answer has a poster — which also
  keeps answers to the confidently-tagged base catalog.

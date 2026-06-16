---
type: feat
summary: Spotify-style category tiles + static/ISR rendering for public posts
---

- Categories now read as real sections, not tags: each has an accent color and
  an optional cover image, rendered as Spotify-style genre tiles under a "Browse"
  subheading (color block + title + merged corner art). Posts list under a
  "Latest" subheading, newest-first (explicit publishedAt desc tiebreak).
- Public blog posts now render statically/ISR (generateStaticParams +
  getPublicPost, no session read) so MDX + Shiki aren't recompiled per request;
  gated posts stay dynamic via the session-aware path (ADR 0011, resolves the
  deferred DA #3). Adds accentColor + coverImageKey to categories (migration).

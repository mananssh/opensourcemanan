---
type: feat
summary: Blog reader UX & MDX polish — figures, accurate TOC, share, prev/next, footnotes
---

Addresses the blog audit (§4):
- Markdown images render as lazy <figure> elements (loading=lazy, decoding=async)
  with an optional caption from the image title.
- Reading time strips code/JSX/markdown before counting and is sourced from the
  stored column everywhere (single source of truth).
- The table of contents is collected during the same rehype pass that assigns
  heading ids, so anchors can never drift from the headings.
- Heading self-links use an appended "#" affordance (aria-labelled) instead of
  wrapping the whole heading in an unannounced link.
- Syntax-highlight token colors are scoped to code spans; line/word highlights
  now have theme-aware backgrounds (+ optional line numbers).
- Added share controls (copy link + X), prev/next post navigation, and footnote
  styling.

---
type: feat
summary: New vertical — Thought Dump, a sticky-note wall (text + images, public/private)
---

The second content collection: a playful corkboard of sticky-note thoughts.
- Two visibility modes mapped onto the shared gate — public (any signed-in user)
  and private (owner only); zero new auth code.
- New "Sticky Desk" theme (.vertical-dump) with a handwriting font (Caveat),
  auto-assigned pastel notes with a slight tilt + tape, both light and dark.
- Owner posts inline (text + one optional image); images are stored privately
  and served via short-lived signed URLs (so a public note's image still needs
  a login), not made world-readable.
- Masonry wall + per-thought permalink (login-gated, noindexed); owner inline
  controls (pin, make public/private, delete-soft). Reuses storage, auth,
  visibility, theming tokens, motion, and the image-upload primitive.

---
type: fix
summary: redesign every light-mode palette — low-glare toned paper, visible structure, AA-validated
---

Light mode was glare-white (`#ffffff`/`#fbfbf9` paper) with invisible structure:
surfaces indistinguishable from paper, hairline rules like `#e6e6e3` on
`#fbfbf9` barely perceptible — simultaneously blinding and washed out.

Redesigned all five light palettes in `app/globals.css` under one principle —
"lamplight, not floodlight" — while keeping each vertical's identity:

- **Root / OSM (Editorial Logbook)**: deepened parchment `#efe7d6`, raised cream
  surface, rules that read as structure.
- **Blog (Kinetic Mono)**: warm newsprint `#ecebe5` — the contrast now comes
  from near-black ink, not white glare; vermilion deepened to `#c23315`.
- **Dump (Sticky Desk)**: toned cool board `#dbe3f1` so note-white surfaces and
  colored stickies pop; crayon blue deepened.
- **Portfolio (Mono + coral)**: warm stone `#e8e6e1` giving the glass panels
  real presence; coral deepened to `#b02c20`; status + Sully tokens re-tuned.
- **Sully stage**: soft sage `#eaf2ec` base, deep emerald accent.

Every combination validated computationally against WCAG: ink ≥12:1,
muted ≥6.5:1, faint ≥4.5:1, accent/status ≥4.5:1 on paper *and* surface,
white-on-accent buttons ≥4.5:1, rules in the 1.3–1.4:1 "visible hairline" band.
Dark mode is untouched.

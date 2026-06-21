---
type: feat
summary: Portfolio polish — glass section panels, clickable cards, tag hovers, redesigned contact, résumé in hero
---

Landing-page craft pass:

- **Liquid-glass sections:** each content section is now a translucent, blurred
  panel that floats over the particle field — legible and visually separated
  without going opaque (new `.section-glass`).
- **Whole-row clickable cards:** the Selected-work, Hackathons, and Experience
  rows are now single click targets that lift + glass on hover (`.lift-card`),
  not just a linked title.
- **Tag hovers:** stack/skill/capability chips fill with the accent glass on
  hover (`.tag-chip`).
- **Contact, redesigned:** labelled, hoverable contact methods plus a short
  "What is OSM?" blurb linking to the manifesto (no more bare link list).
- **Résumé in the hero:** a proper résumé button below the intro (with an "Ask
  Sully about a role" secondary), moved out of the contact link list.

All scoped to `.vertical-portfolio`; reduced-motion disables the lifts. Both
themes.

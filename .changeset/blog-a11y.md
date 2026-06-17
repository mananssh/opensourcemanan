---
type: fix
summary: Blog accessibility pass — focus, skip link, ARIA, contrast, accessible TOC
---

Addresses the blog audit (§3):
- Skip-to-content link in both layouts (+ focusable #content target).
- One global visible :focus-visible ring; removed color-only focus on search and
  admin inputs.
- Reaction button exposes aria-pressed + a descriptive aria-label; copy-code
  buttons get an aria-label, a polite "Code copied" live region, and stay visible
  on touch devices.
- --faint bumped to ≥4.5:1 (AA) in all four palettes; category tiles get a dark
  scrim so white labels stay legible on any accent color.
- Table of contents is now a labelled landmark with a properly nested list, and
  shows as a collapsible panel above the article on mobile (was stranded below).
- Scroll-to-top honors prefers-reduced-motion; progress bar marked decorative.

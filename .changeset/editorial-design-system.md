---
type: feat
summary: Editorial Logbook design system, OSM rebrand, and mandatory light/dark theming
---

Give OSM a real identity, replacing the untouched create-next-app look.

- **Editorial Logbook** aesthetic: Fraunces (display) + Newsreader (body) +
  JetBrains Mono, warm paper/ink palette with an oxblood/terracotta accent,
  subtle paper grain, hairline rules, small-caps mono labels.
- **Semantic design tokens** in `globals.css`, defined for both themes — the
  shared UI-primitive layer features build on.
- **Mandatory light/dark toggle** as a global primitive (next-themes +
  `ThemeToggle`), class-based, no flash. Every feature must support both modes
  (ADR 0005).
- **Rebrand to OSM**: wordmark in header/footer; "Manan Shah" now appears once,
  quietly, in the footer.
- Redesigned the home page (journal masthead + config-driven section index) and
  the /changelog page (editorial treatment).
- **Process**: new `/design-review` skill and a conscious-design-review
  requirement before building UI (ADR 0006); conventions and Definition of Done
  updated with both rules.

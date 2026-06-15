# Changelog

## 2026-06-15

- **22:34 · `9fc3221` · feat:** Color-code changelog type tags and show commit time
  Each changelog entry's type (feat/fix/perf/refactor/docs/test/chore/ci) now
  renders as a highlighted chip with its own muted, paper-harmonized color —
  defined for both light and dark (ADR 0005). The commit time (HH:MM) is shown
  alongside the short hash in each entry's meta line.
- **22:00 · `3d63698` · feat:** Editorial Logbook design system, OSM rebrand, and mandatory light/dark theming
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
- **16:22 · `614e103` · fix:** Merge same-day changelog entries under one date heading
  `scripts/compile-changelog.mjs` now folds new entries into an existing
  same-date section (newest on top) instead of prepending a duplicate
  `## YYYY-MM-DD` heading, so shipping multiple times in one day no longer
  splits the changelog into repeated date groups. `lib/changelog.ts` also
  coalesces duplicate date headings defensively when parsing, and the
  already-duplicated CHANGELOG.md is collapsed into a single section.
- **14:47 · `5a6e2f1` · feat:** Add a public /changelog page rendered from the changeset system
  The changelog is now a public artifact at `/changelog`, rendered as a
  polished, Vercel-style page. It's built as a system, not static content:
  `lib/changelog.ts` parses the compiled `CHANGELOG.md` into structured
  entries (the changelog store), and `app/changelog/page.tsx` renders them
  server-side with per-type badges, commit hashes, and Markdown bodies.
  Source of truth stays the changeset pipeline — no duplication. Also adds a
  config-driven site header (`lib/site-nav.ts`) so new sections become
  reachable by editing a list. Markdown (not MDX) per ADR 0003.
- **14:47 · `5a6e2f1` · ci:** Automate changelog compilation on merge to main
  Add a Release workflow that compiles pending changesets into CHANGELOG.md
  after every merge to main and opens a small auto-merging PR with the
  result — so /changelog updates itself without weakening branch protection.
  Requires a RELEASE_TOKEN PAT (see ADR 0004). Closes the gap where the
  changelog only updated via a manual `npm run changelog`.
- **19:53 · `6b71af4` · fix:** Use the directory/SKILL.md layout for project skills
  Project skills must live at `.claude/skills/<name>/SKILL.md` (the skill
  name derives from the directory) to be discovered by Claude Code. Moved
  the five flat `.claude/skills/<name>.md` files into that layout so
  /commit, /ship, /oss-check, /devils-advocate, and /feature appear.
- **19:53 · `6b71af4` · chore:** Establish the agentic coding architecture
  Set up the foundation for safe, DRY, extensible development:
  agent-kit/ as the single source of truth for conventions, the four-axis
  model, and the systems-not-static principle; docs/ with architecture and
  ADRs; a homegrown changeset system; Claude Code skills (/commit, /ship,
  /oss-check, /devils-advocate, /feature); and CI with typecheck, lint,
  build, gitleaks secret scanning, and a changeset-present check.

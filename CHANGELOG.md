# Changelog

## 2026-06-15

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

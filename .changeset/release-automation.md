---
type: ci
summary: Automate changelog compilation on merge to main
---

Add a Release workflow that compiles pending changesets into CHANGELOG.md
after every merge to main and opens a small auto-merging PR with the
result — so /changelog updates itself without weakening branch protection.
Requires a RELEASE_TOKEN PAT (see ADR 0004). Closes the gap where the
changelog only updated via a manual `npm run changelog`.

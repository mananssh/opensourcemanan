---
type: fix
summary: Merge same-day changelog entries under one date heading
---

`scripts/compile-changelog.mjs` now folds new entries into an existing
same-date section (newest on top) instead of prepending a duplicate
`## YYYY-MM-DD` heading, so shipping multiple times in one day no longer
splits the changelog into repeated date groups. `lib/changelog.ts` also
coalesces duplicate date headings defensively when parsing, and the
already-duplicated CHANGELOG.md is collapsed into a single section.

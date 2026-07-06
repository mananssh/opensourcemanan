---
type: fix
summary: Add portfolio loading/error/404 states, real alt text, indexes
---

The portfolio route group had no `loading.tsx`, `error.tsx`, or scoped
`not-found.tsx`, so a slow fetch showed nothing and a failure or 404 fell
through to the site's unbranded root pages. All three now render inside the
portfolio's own theme and chrome.

Also: project/hackathon cover and gallery images had `alt=""` despite being
real content, not decoration — they now carry descriptive alt text. A
particle-canvas color fallback is now sourced from a semantic token instead
of a single hardcoded hex. `experiences` and `capabilities` gained the same
`sortOrder`/`startedAt` indexes `projects` and `hackathons` already had.

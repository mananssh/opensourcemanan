---
type: feat
summary: site-wide navigation loading feedback (top progress bar, busy cursor, route skeletons) + Reel in the OSM manifesto
---

Clicking a link that navigated to a server-rendered route gave no feedback —
no spinner, no cursor change, nothing until the page appeared. Fixed site-wide:

- **Global top progress bar** (`components/route-progress.tsx`) — an
  indeterminate bar in the active vertical's accent that starts the instant any
  internal link is clicked (capture-phase listener; also back/forward) and
  clears when the new route commits. Plus a `cursor: progress` while pending.
  No dependency, no per-Link wiring; mounted once in the root layout. Reduced
  motion swaps the slide for a pulse.
- **Route skeletons** — a shared `LoadingScreen` (themed via tokens) and a
  `loading.tsx` for every vertical that lacked one (site, blog, dump, movies);
  the portfolio's ad-hoc one now uses the shared component too. App Router shows
  these instantly on navigation to any dynamic route.

Also: the **OSM manifesto** prose now mentions the Reel tracker (it already
appeared in the manifesto index, which renders from `siteNav`).

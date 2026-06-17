---
type: feat
summary: Preview-deployment strategy — OAuth redirect proxy, build skip, pruning
---

Handle Vercel deployment sprawl + preview sign-in (ADR 0013):
- NextAuth redirectProxyUrl (AUTH_REDIRECT_PROXY_URL) so one Google redirect URI
  (prod) covers OAuth on every hashed preview deployment.
- A Vercel Ignored Build Step script that skips deploys for the automated
  release/changelog and dependabot branches.
- A prune script (npm prune-deploys) + weekly workflow that keep production and
  the latest 5 previews and delete the rest via the Vercel API (prod untouched;
  no-ops without VERCEL_* secrets).

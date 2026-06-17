# ADR 0013 — Preview deployments: OAuth proxy, fewer builds, pruning

**Status:** Accepted · 2026-06-17

## Context

Every push/PR creates a Vercel preview deployment, so they pile up. Two pains:
(1) sign-in doesn't work on previews — each has a unique hashed host, and Google
OAuth needs exact, wildcard-free redirect URIs; (2) the count keeps growing,
including noise from the automated `release/changelog-*` PRs.

## Decision

**1. One OAuth callback for all previews — redirect proxy.** NextAuth v5's
`redirectProxyUrl` (env `AUTH_REDIRECT_PROXY_URL`) routes a preview's OAuth flow
through one stable URL (production). Set in `lib/auth.ts`; on previews it points
at prod's `/api/auth`, so a single Google redirect URI covers every preview.
Unset on prod/local → normal behavior.

**2. Skip noise deployments.** A Vercel *Ignored Build Step*
(`scripts/vercel-ignore-build.sh`) cancels deploys for `release/changelog-*` and
`dependabot/*` branches. Real feature-branch previews still deploy.

**3. Prune on a schedule.** Vercel doesn't auto-delete. `scripts/prune-deployments.mjs`
(npm `prune-deploys`) keeps **all production deployments + the latest 5 previews**
and deletes the rest via the Vercel API; production is never touched. Runs weekly
(and on demand) via `.github/workflows/prune-deployments.yml`, skipping cleanly
until secrets are set. `DRY_RUN=1` to preview.

## One-time setup (manual)

- **Vercel → Project → Settings → Environment Variables (Preview only):**
  `AUTH_REDIRECT_PROXY_URL = https://<prod-domain>/api/auth`.
- **Google Cloud → OAuth client:** ensure `https://<prod-domain>/api/auth/callback/google`
  is an authorized redirect URI (it already is for prod). No per-preview URIs needed.
- **Vercel → Settings → Git → Ignored Build Step:** `bash scripts/vercel-ignore-build.sh`.
- **GitHub Actions secrets** (for pruning): `VERCEL_TOKEN`, `VERCEL_PROJECT_ID`
  (from `.vercel/project.json` or the dashboard), and `VERCEL_TEAM_ID` if the
  project is team-scoped.

## Consequences

- Login works on any preview through one registered callback.
- Fewer deployments created; the rest are pruned to prod + latest 5 weekly.
- Pruning needs a Vercel token (scoped); the workflow no-ops without it.
- Prod deployments are retained (rollback intact).

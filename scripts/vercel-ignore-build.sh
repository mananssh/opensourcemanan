#!/usr/bin/env bash
# Vercel "Ignored Build Step" command. Exit 0 = SKIP the deploy, exit 1 = BUILD.
# Skips noise previews (the automated release/changelog PRs and dependabot bumps)
# so we don't accumulate deployments nobody reviews. See ADR 0013.
#
# Set in Vercel → Project → Settings → Git → Ignored Build Step:
#   bash scripts/vercel-ignore-build.sh

ref="${VERCEL_GIT_COMMIT_REF:-}"

case "$ref" in
  release/changelog-* | dependabot/*)
    echo "↳ Skipping deploy for branch: $ref"
    exit 0
    ;;
  *)
    echo "↳ Building for branch: $ref"
    exit 1
    ;;
esac

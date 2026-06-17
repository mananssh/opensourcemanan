---
type: ops
summary: Run the deployment prune on every merge to main
---

The prune-deployments workflow now also triggers on push to main, so the
deployment created by each merge is pruned down to the keep window right away
(latest 3 production + 5 previews) instead of accumulating until the weekly cron.
The weekly cron and manual dispatch remain as a safety net.

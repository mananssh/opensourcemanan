---
type: feat
summary: Prune keeps latest 3 production + 5 preview deployments
---

The deployment prune script previously kept every production deployment. It now
keeps the latest 3 production (PRUNE_KEEP_PRODUCTION) alongside the latest 5
previews (PRUNE_KEEP) and deletes the rest, sorted by recency. The live
production deployment is always newest so it's always retained; the rollback
window shrinks to the last 3 production builds. ADR 0013 + workflow input updated.

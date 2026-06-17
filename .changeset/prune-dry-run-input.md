---
type: feat
summary: Prune workflow gains a dry_run dispatch input
---

The Prune deployments workflow now has a `dry_run` boolean dispatch input. When
checked, it sets DRY_RUN=1 so the run lists what would be deleted and deletes
nothing — making it safe to preview the delete list from the Actions tab before
a real prune.

# agent-kit

**Read this before working in this repo.** This folder is the single source of truth for *how* we build here — agents and humans both. `AGENTS.md` (and `CLAUDE.md`, which includes it) point here.

## Files

| File | What it governs |
|------|-----------------|
| [conventions.md](./conventions.md) | Architecture model, the systems-not-static principle, feature-module convention, code style. **The most important doc.** |
| [commit-and-pr.md](./commit-and-pr.md) | Commit format, branch/PR flow, changeset rules. |
| [oss-safety.md](./oss-safety.md) | What must never go public. Checked before every commit. |
| [definition-of-done.md](./definition-of-done.md) | The bar a change must clear before it ships. |

## The one-paragraph version

This is a public, all-in-one personal site (portfolio + blog + whatever), deployed to Vercel. The mission is **extensibility with DRY as the top principle**: adding a feature should be assembling existing pieces, never rebuilding plumbing. Everything is a **system, not static content** — a blog is a blog *system*, not hardcoded pages. Every change flows branch → PR → green CI → merge to `main` (which stays deployed). Nothing ships public without a secret/PII safety pass. See [conventions.md](./conventions.md) for how, and [definition-of-done.md](./definition-of-done.md) for the bar.

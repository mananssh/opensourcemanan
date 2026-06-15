---
allowed-tools: Bash(git fetch:*), Bash(git checkout:*), Bash(git branch:*), Bash(git push:*), Bash(git status:*), Bash(git log:*), Bash(git rev-parse:*), Bash(gh pr:*), Bash(gh api:*), Read
description: Branch from the latest origin/main, push, and open a PR to main with the template. Reports CI status.
---

# /ship

Take committed work from a feature branch to an open PR against `main`. `main` is protected — everything reaches it via PR.

## Steps

1. **Sync.** `git fetch origin`.

2. **Ensure a feature branch off latest main.**
   - If currently on `main`: create one — `git checkout -b <type>/<short-desc> origin/main` — then advise the user to move their commits over (or stop if there are none).
   - If already on a feature branch: optionally rebase onto `origin/main` to stay current (ask before rewriting history if the branch is already pushed).

3. **Push.** `git push -u origin <branch>`.

4. **Open the PR** with `gh pr create --base main`, using the repository PR template. Write a comprehensive summary from the **full commit history** of the branch (`git log origin/main..HEAD`), not just the latest commit. Include a test plan.

5. **Report CI.** After creating the PR, surface its checks (`gh pr checks` / `gh pr view`). Remind: merge only when CI is green. Do not merge automatically.

## Notes

- Branch prefixes match commit types: `feat/`, `fix/`, `refactor/`, `docs/`, `test/`, `chore/`, `perf/`, `ci/`.
- CI enforces the hard gates (typecheck, lint, build, gitleaks, changeset-present).

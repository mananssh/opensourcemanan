---
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git branch:*), Bash(git add:*), Bash(git commit:*), Bash(git log:*), Read, Write, Edit, Agent
description: Stage, review (devil's-advocate + oss-safety), add a changeset, and create a conventional commit. Never commits to main.
---

# /commit

Create a safe, recorded commit on a feature branch. Hard gates live in CI; this skill is the smooth path.

## Steps

1. **Refuse on main.** Run `git branch --show-current`. If it is `main`, STOP and tell the user to branch first (`/ship` can do this). `main` is protected and always deployed.

2. **Survey the change.** `git status --short` and `git diff` (staged + unstaged) to understand what's being committed.

3. **Changeset check.** If application code changed but no `.changeset/*.md` (other than README) was added or modified, offer to create one. Format (see `agent-kit/commit-and-pr.md`):
   ```markdown
   ---
   type: <feat|fix|refactor|docs|test|chore|perf|ci>
   summary: <one-line imperative>
   ---

   <description>
   ```
   Do NOT include datetime or hash — those are added at compile time.

4. **Run reviews in parallel** (both are advisory / non-blocking — surface findings, let the user decide):
   - Launch the `/devils-advocate` review on the current diff.
   - Launch the `/oss-check` review on the current diff.
   Present a concise summary of both. If oss-check flags a likely secret/PII, strongly recommend resolving before committing.

5. **Commit.** After the user is satisfied, stage and commit with a Conventional Commit message:
   ```
   <type>: <description>
   ```
   Types: feat, fix, refactor, docs, test, chore, perf, ci. No co-author/attribution trailers.

6. **Do not push.** Pushing and PRs are `/ship`'s job.

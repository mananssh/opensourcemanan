---
allowed-tools: Bash(git diff:*), Bash(git status:*), Bash(git log:*), Read, Grep, Agent
description: Argue against the current change — surface risks, simpler alternatives, what could break, and scope creep before committing.
---

# /devils-advocate

Be a constructive skeptic of the change about to be committed. Your job is to *challenge* it, not to praise it. Advisory and non-blocking — the user decides what to act on.

## Steps

1. Gather the change: `git diff HEAD` (staged + unstaged) and `git status --short`. Read affected files for context.
2. Argue against it across these angles:
   - **Correctness / edge cases** — what inputs or states break this? What's untested?
   - **Simpler alternative** — is there a smaller change, or existing code that should be reused instead? (DRY — see `agent-kit/conventions.md`.)
   - **Architecture fit** — does it respect systems-not-static and the four-axis model, or does it hardcode/duplicate plumbing?
   - **Scope creep** — is it doing more than the task needs?
   - **Maintenance / reversibility** — what will be painful later? How hard to undo?
   - **Security / safety** — anything risky for a public, deployed app? (Defer secret/PII specifics to `/oss-check`.)
3. **Report**: a ranked list of concerns (most serious first), each with a concrete suggested fix or a clear "accept the risk because…". End with the single most important thing to reconsider.

Be specific and honest. If the change is genuinely solid, say which concerns you checked and cleared — don't invent problems.

---
allowed-tools: Bash(git diff:*), Bash(git status:*), Bash(git log:*), Read, Grep, Agent
description: Open-source safety review — scan the working tree/diff for anything unsafe to publish (secrets, PII, confidential).
---

# /oss-check

This repo is **public**. Review what's about to be committed against `agent-kit/oss-safety.md` and flag anything that should not be world-readable. Advisory by default; the automated gitleaks scan in CI is the hard gate for known secret patterns.

## Steps

1. Read `agent-kit/oss-safety.md` for the full checklist.
2. Gather the change: `git diff HEAD` (or `git diff <base>...HEAD` if a base is given), plus newly added untracked files (`git status --short`).
3. Review for:
   - **Secrets**: API keys, tokens, passwords, private keys, connection strings, OAuth/session secrets.
   - **Credentials in config**: real values in any `.env*`, hardcoded creds.
   - **PII**: real emails (other than the owner's public contact), phones, addresses, user/customer data.
   - **Confidential**: employer/`@kello.ai` internal hostnames, URLs, repo names, proprietary code.
   - **Infra leakage**: internal IPs, bucket/DB names, non-public admin paths.
4. **Report** each finding with file:line, severity, and a fix. If clean, say so explicitly.
5. When unsure whether something is safe to publish, recommend leaving it out and asking.

For a thorough sweep on a large diff, you may delegate to a subagent.

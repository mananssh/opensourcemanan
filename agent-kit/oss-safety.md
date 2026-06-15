# Open-Source Safety

This repo is **public**. Everything committed is world-readable, forever — even if later deleted, it stays in git history and may be cached/indexed. Before every commit, confirm nothing below is leaking.

## Must NEVER be committed

- **Secrets**: API keys, tokens, passwords, private keys, certificates, connection strings, OAuth client secrets, session secrets.
- **Credentials in config**: real values in `.env*` (committing `.env*` is blocked by `.gitignore` — keep it that way; use `.env.example` with placeholders).
- **PII**: real emails (other than the owner's public contact), phone numbers, addresses, real user/customer data.
- **Employer / third-party confidential**: internal hostnames, internal URLs, private repo names, proprietary code, anything from `@kello.ai` work that isn't yours to publish.
- **Infra detail that aids attackers**: internal IPs, bucket names, DB hostnames, admin paths that aren't meant to be discoverable.

## Practices

- Secrets come from environment variables (Vercel project settings), never source.
- New env var → add a placeholder line to `.env.example` and document it; never the real value.
- Server-only code must not be importable from the client; secrets stay server-side.
- When unsure whether something is safe to publish, **leave it out and ask**.

## Enforcement (defense in depth)

1. **`/oss-check`** — LLM review against this list, run automatically by `/commit` (advisory).
2. **gitleaks** — automated secret-pattern scan in CI; a hit **fails the PR** (hard gate for known patterns).
3. **`.gitignore`** — blocks `.env*`, `*.pem`, etc. from being staged at all.

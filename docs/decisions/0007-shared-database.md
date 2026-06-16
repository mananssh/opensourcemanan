# ADR 0007 — One shared database, schema-file-driven with Drizzle

**Status:** Accepted · 2026-06-16

## Context

Features will increasingly need persistence (blog posts, etc.). We want the
**Data axis** to be a shared resource: one database every feature adds tables
to, not a database per feature. And schema drift must be impossible — changes
have to be deliberate, reviewed, and migrated, never ad-hoc SQL against prod.

## Decision

**One CockroachDB Serverless cluster** (Postgres wire-compatible), with
**Drizzle ORM + drizzle-kit** as the schema/migration/query layer.

- **Tool: Drizzle**, over Prisma and Atlas HCL. The schema is *TypeScript*
  (fits the TS-everywhere principle), `drizzle-kit generate` produces SQL
  migrations from it, and the same package gives type-safe queries — one
  lightweight, serverless-friendly dependency instead of a separate DSL +
  generated client (Prisma) or a non-TS schema language + separate query layer
  (Atlas).
- **CockroachDB**, because it's Postgres-compatible (so the `postgresql`
  dialect just works), has a generous serverless free tier, and scales without
  ops.
- **Shared schema, one aggregation point.** `db/schema/index.ts` re-exports
  every feature's table module; `db/client.ts` is the single lazy connection.
- **The rule:** schema change → `db/schema/*` edit → `npm run db:generate` →
  commit the migration. Enforced on PRs by the "DB schema in sync" CI check
  (regenerates and fails if a migration is missing).
- **Migrate on merge to main.** A `Migrate` workflow runs `db:migrate` against
  the prod DB on push to `main`. Additive migrations are deploy-order-safe with
  Vercel; the job skips cleanly until `DATABASE_URL` is configured.

## Consequences

- `DATABASE_URL` must exist as a GitHub Actions secret (migrations) and a Vercel
  env var (runtime). Never committed (`.env*` gitignored).
- The connection is a lazy singleton with `max: 1` — safe for serverless and
  safe to import at build time without a database.
- No feature tables exist yet; the first lands with the first feature needing
  persistence. The pipeline (generate → in-sync check → migrate) is in place.
- Rejected: Prisma (heavier, DSL + generated client, pooling care on
  serverless) and Atlas HCL (non-TS schema, needs a separate query layer).

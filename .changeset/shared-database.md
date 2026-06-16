---
type: feat
summary: Add the shared CockroachDB database primitive (Drizzle)
---

Stand up the shared Data-axis foundation: one CockroachDB (Postgres-compatible)
database that every feature adds tables to. Drizzle ORM + drizzle-kit provide
the TypeScript schema, migrations, and type-safe queries; `db/client.ts` is a
lazy serverless-safe singleton and `db/schema/index.ts` is the aggregation
point. The rule — change the schema file, run `npm run db:generate`, commit the
migration — is enforced by a new "DB schema in sync" CI check, and a Migrate
workflow applies migrations on merge to main. No feature tables yet; the
pipeline is ready for the first one. Requires a DATABASE_URL secret (ADR 0007).

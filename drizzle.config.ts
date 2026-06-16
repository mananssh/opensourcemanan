import { defineConfig } from "drizzle-kit";

/**
 * Drizzle Kit config — the shared database's schema/migration toolchain.
 *
 * - `schema` is the single aggregation point; every feature's tables are
 *   re-exported from there.
 * - `generate` (offline) diffs the schema against the committed migrations and
 *   writes a new SQL migration. `migrate` applies pending migrations to the DB.
 * - The rule: change the schema in TypeScript, run `npm run db:generate`, and
 *   commit the migration. See agent-kit/database.md and ADR 0007.
 */
export default defineConfig({
  dialect: "postgresql", // CockroachDB is Postgres wire-compatible
  schema: "./db/schema/index.ts",
  out: "./db/migrations",
  casing: "snake_case",
  dbCredentials: {
    // Only needed by `migrate`/`push`/`studio`; `generate` runs offline.
    url: process.env.DATABASE_URL ?? "",
  },
});

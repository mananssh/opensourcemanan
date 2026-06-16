# Database — the shared data store

One CockroachDB (Postgres-compatible) database backs the whole site. Every
feature that needs persistence **adds its own tables to the shared schema** —
there is no per-feature database. Drizzle ORM is the schema + migration + query
layer. See [ADR 0007](../docs/decisions/0007-shared-database.md) for the why.

## The rule (non-negotiable)

**Schema changes go through the schema file and a committed migration. Always.**

1. Add or change tables in a `db/schema/<feature>.ts` module.
2. Re-export it from `db/schema/index.ts` (the aggregation point drizzle reads).
3. Run `npm run db:generate` — this writes a SQL migration under `db/migrations/`.
4. Commit the schema change **and** the generated migration together.
5. On merge to `main`, CI applies pending migrations to the prod DB.

CI enforces this: the **"DB schema in sync"** check regenerates migrations on
every PR and fails if the schema changed without a committed migration. Never
hand-edit the database or write ad-hoc SQL — the schema file is the source of
truth.

## Adding a table

```ts
// db/schema/blog.ts
import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

export const posts = pgTable("posts", {
  id: uuid().primaryKey().defaultRandom(),
  title: text().notNull(),
  slug: text().notNull().unique(),
  body: text().notNull(),
  publishedAt: timestamp({ withTimezone: true }),
});
```

```ts
// db/schema/index.ts — re-export so drizzle-kit sees it
export * from "./blog";
```

Then `npm run db:generate` and commit `db/migrations/*`.

## Querying

```ts
import { db } from "@/db/client";
import { posts } from "@/db/schema";

const published = await db.select().from(posts).where(/* … */);
```

`db` is a lazy singleton (one pooled connection per warm serverless instance).
Importing it never connects — it initializes on first query — so it's safe in
modules that build without a database.

## Scripts

| Command | What it does |
|---------|--------------|
| `npm run db:generate` | Diff schema → write a new SQL migration (offline). |
| `npm run db:migrate` | Apply pending migrations to `DATABASE_URL`. |
| `npm run db:studio` | Open Drizzle Studio against the DB. |

## Setup (one-time)

1. Create a **CockroachDB Serverless** cluster (free tier is fine).
2. Put its connection string in `.env.local` as `DATABASE_URL` (see
   `.env.example`) for local dev.
3. Add `DATABASE_URL` as a **GitHub Actions secret** (for the migrate workflow)
   and as a **Vercel environment variable** (for runtime).

`.env*` is gitignored — never commit a real connection string (see
[oss-safety.md](./oss-safety.md)).

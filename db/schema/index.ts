/**
 * Shared database schema — the single aggregation point.
 *
 * Every feature owns a module here (e.g. `db/schema/blog.ts`) and re-exports it
 * below. `drizzle-kit` reads THIS file to generate migrations, so a table only
 * exists once it's exported here.
 *
 * The rule (ADR 0007, agent-kit/database.md):
 *   1. Add/change tables in a `db/schema/<feature>.ts` module.
 *   2. Re-export it here.
 *   3. Run `npm run db:generate` and commit the generated migration.
 *   4. CI applies migrations on merge to main.
 *
 * Example:
 *   // db/schema/blog.ts
 *   import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
 *   export const posts = pgTable("posts", {
 *     id: uuid().primaryKey().defaultRandom(),
 *     title: text().notNull(),
 *     publishedAt: timestamp({ withTimezone: true }),
 *   });
 *
 *   // then here:
 *   export * from "./blog";
 *
 * The blog is the first collection.
 */

export * from "./blog";
export * from "./dump";
export * from "./portfolio";
export * from "./agent";
export * from "./ask";

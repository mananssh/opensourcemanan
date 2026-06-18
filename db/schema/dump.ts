import {
  pgTable,
  pgEnum,
  uuid,
  text,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

/**
 * Thought Dump — the second content collection. A wall of sticky-note thoughts
 * (text + an optional image). Only two visibility modes:
 *   - public  → readable by any signed-in user (maps to the shared `authed` gate)
 *   - private → owner only (maps to the shared `owner` gate)
 * See lib/dump/visibility.ts for the mapping onto lib/content/visibility.
 */
export const thoughtVisibility = pgEnum("thought_visibility", [
  "public",
  "private",
]);

export const thoughts = pgTable(
  "thoughts",
  {
    id: uuid().primaryKey().defaultRandom(),
    body: text().notNull().default(""), // plain text, rendered escaped
    imageKey: text(), // optional single GCS object key (private; signed reads)
    visibility: thoughtVisibility().notNull().default("private"),
    pinned: boolean().notNull().default(false),
    deletedAt: timestamp({ withTimezone: true }), // soft delete (recoverable)
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("thoughts_visibility_created_idx").on(t.visibility, t.createdAt)],
);

export type Thought = typeof thoughts.$inferSelect;

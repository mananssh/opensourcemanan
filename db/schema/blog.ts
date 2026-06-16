import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";

/** Four-mode visibility, shared by posts and categories (most-restrictive wins). */
export const visibility = pgEnum("visibility", [
  "public",
  "authed",
  "allowlist",
  "owner",
]);

export const postStatus = pgEnum("post_status", ["draft", "published"]);

export const categories = pgTable("categories", {
  id: uuid().primaryKey().defaultRandom(),
  slug: text().notNull().unique(),
  name: text().notNull(),
  description: text(),
  accentColor: text().notNull().default("#3b3b3b"), // tile background (Spotify-style)
  coverImageKey: text(), // GCS key for the tile's merged background image
  visibility: visibility().notNull().default("public"),
  allowedEmails: text().array().notNull().default([]),
  sortOrder: integer().notNull().default(0),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const posts = pgTable("posts", {
  id: uuid().primaryKey().defaultRandom(),
  slug: text().notNull().unique(),
  title: text().notNull(),
  excerpt: text(),
  bodyMdx: text().notNull().default(""),
  coverImageKey: text(), // GCS object key (see lib/storage)
  categoryId: uuid().references(() => categories.id, { onDelete: "set null" }),
  visibility: visibility().notNull().default("public"),
  allowedEmails: text().array().notNull().default([]),
  status: postStatus().notNull().default("draft"),
  publishedAt: timestamp({ withTimezone: true }),
  readingMinutes: integer().notNull().default(1),
  metaTitle: text(),
  metaDescription: text(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export type Category = typeof categories.$inferSelect;
export type Post = typeof posts.$inferSelect;

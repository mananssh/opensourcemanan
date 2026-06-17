import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  timestamp,
  primaryKey,
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

export const tags = pgTable("tags", {
  id: uuid().primaryKey().defaultRandom(),
  slug: text().notNull().unique(),
  name: text().notNull(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const postTags = pgTable(
  "post_tags",
  {
    postId: uuid()
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    tagId: uuid()
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.postId, t.tagId] })],
);

/** One reaction (like) per signed-in user per post. */
export const reactions = pgTable(
  "reactions",
  {
    postId: uuid()
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    userEmail: text().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.postId, t.userEmail] })],
);

/** Comments from signed-in users; owner-moderated (delete). Plaintext body. */
export const comments = pgTable("comments", {
  id: uuid().primaryKey().defaultRandom(),
  postId: uuid()
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  userEmail: text().notNull(),
  userName: text().notNull(),
  body: text().notNull(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

/** Per-post view counter. */
export const postViews = pgTable("post_views", {
  postId: uuid()
    .primaryKey()
    .references(() => posts.id, { onDelete: "cascade" }),
  count: integer().notNull().default(0),
});

/** Newsletter signups (provider integration deferred — we just capture). */
export const subscribers = pgTable("subscribers", {
  email: text().primaryKey(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export type Category = typeof categories.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type Tag = typeof tags.$inferSelect;
export type Comment = typeof comments.$inferSelect;

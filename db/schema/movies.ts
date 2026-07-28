import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  smallint,
  boolean,
  date,
  timestamp,
  index,
  uniqueIndex,
  primaryKey,
} from "drizzle-orm/pg-core";

/**
 * Reel — the movie/TV tracker. This vertical is the repo's FIRST multi-user
 * feature: unlike blog/dump (owner-authored, gated by lib/content/visibility),
 * every signed-in Google user owns their own rows here. Authorization is
 * per-row (entry.viewerId === current viewer), enforced in app/movies/actions.ts
 * and lib/movies/identity.ts — NOT the owner/allowlist gate.
 *
 * - `watchers`      — one row per member, provisioned on first sign-in; the
 *   identity layer the JWT session lacks. Keyed to the Google email; carries a
 *   unique @handle. This is NOT the singleton portfolio `profile` table.
 * - `watchEntries`  — the collection: one title a watcher has logged. TMDB
 *   metadata is denormalized onto the row so lists/public profiles render with
 *   zero TMDB calls.
 * - `movieCache`    — TTL key/value cache for TMDB responses (search + details)
 *   so the free tier survives repeated lookups. Mirrors `agent_cache`.
 */

export const mediaType = pgEnum("media_type", ["movie", "tv"]);
export const watchStatus = pgEnum("watch_status", [
  "watched",
  "watching",
  "watchlist",
]);

export const watchers = pgTable(
  "watchers",
  {
    id: uuid().primaryKey().defaultRandom(),
    email: text().notNull().unique(), // the Google account — join key to the session
    handle: text().notNull().unique(), // lowercase [a-z0-9_]{3,20}; the public @
    displayName: text(),
    avatarUrl: text(), // seeded from Google on first sign-in
    bio: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("watchers_handle_idx").on(t.handle)],
);

export const watchEntries = pgTable(
  "watch_entries",
  {
    id: uuid().primaryKey().defaultRandom(),
    viewerId: uuid()
      .notNull()
      .references(() => watchers.id, { onDelete: "cascade" }),
    tmdbId: integer().notNull(),
    mediaType: mediaType().notNull(),
    // Denormalized TMDB snapshot — render lists without touching TMDB.
    title: text().notNull(),
    posterPath: text(),
    releaseYear: integer(),
    runtimeMinutes: integer(),
    genres: text().array().notNull().default([]),
    status: watchStatus().notNull().default("watched"),
    rating: smallint(), // nullable; 1–10 = half-star scale (½–5★)
    watchedOn: date(), // nullable; powers timeline / streaks / "this year"
    note: text(),
    favorite: boolean().notNull().default(false),
    rewatches: integer().notNull().default(0),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // One row per title per watcher; a re-watch bumps `rewatches`.
    uniqueIndex("watch_entries_viewer_title_idx").on(
      t.viewerId,
      t.tmdbId,
      t.mediaType,
    ),
    index("watch_entries_viewer_status_idx").on(t.viewerId, t.status),
    index("watch_entries_viewer_watched_idx").on(t.viewerId, t.watchedOn),
    index("watch_entries_viewer_created_idx").on(t.viewerId, t.createdAt),
  ],
);

/**
 * The follow graph. NOT a social feed — you only see someone's activity if you
 * follow them by their exact @handle (Phase 2). A directed edge: `followerId`
 * follows `followeeId`. Composite PK makes a follow idempotent; the reverse
 * index answers "who follows me".
 */
export const follows = pgTable(
  "follows",
  {
    followerId: uuid()
      .notNull()
      .references(() => watchers.id, { onDelete: "cascade" }),
    followeeId: uuid()
      .notNull()
      .references(() => watchers.id, { onDelete: "cascade" }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.followerId, t.followeeId] }),
    index("follows_followee_idx").on(t.followeeId),
  ],
);

export const movieCache = pgTable(
  "movie_cache",
  {
    key: text().primaryKey(), // e.g. "tmdb:search:<slug>" | "tmdb:title:<type>:<id>"
    value: text().notNull(), // JSON string
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("movie_cache_expires_idx").on(t.expiresAt)],
);

export type Watcher = typeof watchers.$inferSelect;
export type WatchEntry = typeof watchEntries.$inferSelect;
export type Follow = typeof follows.$inferSelect;
export type MovieCache = typeof movieCache.$inferSelect;

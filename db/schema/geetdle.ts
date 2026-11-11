import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

/**
 * Geetdle — the daily Bollywood song guessing game's private catalog.
 *
 * Unlike the game's old static `content/games/geetdle/songs.json` (shipped to
 * the browser), the full catalog lives ONLY here: the daily answer is chosen
 * server-side and never reaches the client, and guesses are evaluated on the
 * server (see lib/games/geetdle/daily.ts + app/games/geetdle/api/*). The JSON
 * sources used to seed this table are gitignored — nothing ships in the repo.
 *
 * - `songUuid`         — stable id from the source, the idempotent upsert key.
 * - `titleLower`       — lowercased title; the indexed column autocomplete and
 *                        guess-resolution query against (the display `title`
 *                        keeps original casing).
 * - `isAnswerEligible` — the whole catalog is searchable for *guesses*, but
 *                        daily *answers* are drawn only from eligible rows, so
 *                        an obscure B-side never becomes the puzzle. The daily
 *                        pick is seeded by the puzzle number and weighted 75/25
 *                        toward songs from 2000 onward.
 * - `popularity`       — nullable play-count/rank for future answer curation.
 */
export const geetdleSongs = pgTable(
  "geetdle_songs",
  {
    id: uuid().primaryKey().defaultRandom(),
    songUuid: text().notNull().unique(),
    title: text().notNull(),
    titleLower: text().notNull(),
    singers: text().notNull().default(""),
    movie: text().notNull().default(""), // album/film title
    year: integer().notNull(),
    musicDirector: text().notNull().default(""),
    language: text().notNull().default("Hindi"),
    genre: text(),
    secondaryGenres: text().array().notNull().default([]),
    youtubeUrl: text(),
    popularity: integer(), // nullable; play count / rank for answer curation
    isAnswerEligible: boolean().notNull().default(true),
    source: text().notNull().default("mrasacker"),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("geetdle_songs_year_idx").on(t.year),
    index("geetdle_songs_eligible_year_idx").on(t.isAnswerEligible, t.year),
    index("geetdle_songs_title_lower_idx").on(t.titleLower),
  ],
);

export type GeetdleSong = typeof geetdleSongs.$inferSelect;
export type NewGeetdleSong = typeof geetdleSongs.$inferInsert;

import "server-only";

import { and, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { geetdleSongs, type GeetdleSong } from "@/db/schema";
import { getPuzzleNumber } from "./rules";
import type { BollywoodSong } from "./types";

/**
 * Server-only data access for Geetdle. The full catalog lives in the DB and
 * never ships to the client: the daily answer is picked here (seeded by the
 * puzzle number, weighted 75/25 by year), autocomplete is a search endpoint,
 * and guesses are resolved + scored on the server. See app/games/geetdle/api/*.
 */

export { getPuzzleNumber };

/** Fraction of days whose answer is drawn from the 2000-onward pool. */
const POST_2000_WEIGHT = 0.75;
const YEAR_PIVOT = 2000;
/** Decorrelates the seed from the old `days % n` index. */
const SEED_SALT = 0x9e3779b9;

/** Deterministic PRNG (mulberry32) — same seed → same sequence everywhere. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// The daily answer is stable for a given puzzle number; cache per warm instance.
const dailyCache = new Map<number, GeetdleSong | null>();

/**
 * The daily answer: deterministic for the puzzle number, drawn from the
 * answer-eligible pool, weighted 75% toward songs from 2000 onward and 25%
 * toward earlier songs. Falls back to the other pool if one is empty.
 */
export async function getDailySong(
  puzzle = getPuzzleNumber(),
): Promise<GeetdleSong | null> {
  const cached = dailyCache.get(puzzle);
  if (cached !== undefined) return cached;

  const rng = mulberry32(puzzle + SEED_SALT);
  const preferPost = rng() < POST_2000_WEIGHT;

  const pickFrom = async (post: boolean): Promise<GeetdleSong | null> => {
    const where = and(
      eq(geetdleSongs.isAnswerEligible, true),
      post
        ? gte(geetdleSongs.year, YEAR_PIVOT)
        : lt(geetdleSongs.year, YEAR_PIVOT),
    );
    const [{ c }] = await db
      .select({ c: sql<number>`count(*)::int` })
      .from(geetdleSongs)
      .where(where);
    const count = Number(c);
    if (!count) return null;
    const offset = Math.floor(rng() * count);
    const [row] = await db
      .select()
      .from(geetdleSongs)
      .where(where)
      .orderBy(geetdleSongs.songUuid) // stable order for a stable OFFSET
      .limit(1)
      .offset(offset);
    return row ?? null;
  };

  const song = (await pickFrom(preferPost)) ?? (await pickFrom(!preferPost));
  dailyCache.set(puzzle, song);
  return song;
}

/** Autocomplete: match the catalog by title substring (case-insensitive). */
export async function searchSongs(
  query: string,
  limit = 8,
): Promise<
  Array<{ id: string; title: string; movie: string; year: number; singers: string }>
> {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  // Escape LIKE wildcards in user input so they match literally.
  const esc = q.replace(/[\\%_]/g, "\\$&");
  return db
    .select({
      id: geetdleSongs.id,
      title: geetdleSongs.title,
      movie: geetdleSongs.movie,
      year: geetdleSongs.year,
      singers: geetdleSongs.singers,
    })
    .from(geetdleSongs)
    .where(sql`${geetdleSongs.titleLower} LIKE ${`%${esc}%`} ESCAPE '\\'`)
    .orderBy(sql`${geetdleSongs.popularity} DESC NULLS LAST`, geetdleSongs.title)
    .limit(limit);
}

/** Resolve a guessed song by its catalog id. */
export async function getSongById(id: string): Promise<GeetdleSong | null> {
  const [row] = await db
    .select()
    .from(geetdleSongs)
    .where(eq(geetdleSongs.id, id))
    .limit(1);
  return row ?? null;
}

/** Map a DB row to the shape the pure scoring logic (checkGuess) expects. */
export function toBollywoodSong(r: GeetdleSong): BollywoodSong {
  return {
    song_title: r.title,
    movie: r.movie,
    music_director: r.musicDirector,
    singers: r.singers,
    year: r.year,
    language: r.language,
    genre: r.genre ?? "",
    youtube_url: r.youtubeUrl ?? "",
  };
}

/** YouTube thumbnail for the poster hint (null if no/!parseable URL). */
export function youtubeThumb(url: string | null): string | null {
  if (!url) return null;
  const id = url.match(/(?:v=|\/)([\w-]{11})/)?.[1];
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}

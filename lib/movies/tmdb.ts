import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { movieCache } from "@/db/schema";
import { safeDb } from "@/lib/blog/safe-db";

/**
 * TMDB client for the Reel tracker. DEGRADATION-SAFE like lib/agent/tools/tavily:
 * a missing key, a non-2xx, or a network error all resolve to `[]`/`null` — never
 * a throw — so search just returns nothing rather than 500ing the page.
 *
 * Responses are cached in `movie_cache` (search 1 day, details 30 days) so the
 * free tier survives repeated lookups. Uses the TMDB v4 read-access token as a
 * Bearer credential.
 */

const BASE_URL = process.env.TMDB_BASE_URL ?? "https://api.themoviedb.org/3";

const SEARCH_TTL_MS = 24 * 60 * 60 * 1000; // 1 day
const DETAIL_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export type TmdbMediaType = "movie" | "tv";

/** A search hit (the denormalized fields we snapshot onto a watch entry). */
export interface TmdbResult {
  tmdbId: number;
  mediaType: TmdbMediaType;
  title: string;
  posterPath: string | null;
  releaseYear: number | null;
  overview: string;
}

/** Full detail for one title — adds runtime + genres (+ TV season/episode counts). */
export interface TmdbDetail extends TmdbResult {
  runtimeMinutes: number | null;
  genres: string[];
  seasonsTotal: number | null; // TV only
  episodesTotal: number | null; // TV only
}

function cacheKey(kind: string, id: string): string {
  return `tmdb:${kind}:${id.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 100)}`;
}

async function readCache<T>(key: string): Promise<T | null> {
  return safeDb<T | null>(async () => {
    const rows = await db
      .select()
      .from(movieCache)
      .where(eq(movieCache.key, key))
      .limit(1);
    const row = rows[0];
    if (!row || new Date(row.expiresAt).getTime() < Date.now()) return null;
    return JSON.parse(row.value) as T;
  }, null);
}

async function writeCache<T>(key: string, value: T, ttlMs: number): Promise<void> {
  await safeDb(async () => {
    const expiresAt = new Date(Date.now() + ttlMs);
    const value_ = JSON.stringify(value);
    await db
      .insert(movieCache)
      .values({ key, value: value_, expiresAt })
      .onConflictDoUpdate({
        target: movieCache.key,
        set: { value: value_, expiresAt },
      });
    return null;
  }, null);
}

async function tmdbFetch<T>(path: string, signal?: AbortSignal): Promise<T | null> {
  const token = process.env.TMDB_API_KEY;
  if (!token) return null;
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { authorization: `Bearer ${token}`, accept: "application/json" },
      signal,
    });
    if (!res.ok) return null; // 401 / 429 / anything → degrade silently
    return (await res.json()) as T;
  } catch {
    return null; // network / abort → degrade
  }
}

function yearFrom(date: string | undefined): number | null {
  if (!date) return null;
  const y = Number(date.slice(0, 4));
  return Number.isFinite(y) && y > 1870 ? y : null;
}

interface RawMulti {
  results?: Array<{
    id: number;
    media_type?: string;
    title?: string; // movie
    name?: string; // tv
    poster_path?: string | null;
    release_date?: string; // movie
    first_air_date?: string; // tv
    overview?: string;
  }>;
}

/**
 * Multi-search across movies + tv, most-popular first. Person results and
 * anything without a poster are dropped (a tracker wants watchable titles).
 */
export async function searchTitles(
  query: string,
  signal?: AbortSignal,
): Promise<TmdbResult[]> {
  const q = query.trim();
  if (!q) return [];

  const key = cacheKey("search", q);
  const cached = await readCache<TmdbResult[]>(key);
  if (cached) return cached;

  const data = await tmdbFetch<RawMulti>(
    `/search/multi?query=${encodeURIComponent(q)}&include_adult=false&language=en-US&page=1`,
    signal,
  );
  if (!data?.results) return [];

  const results: TmdbResult[] = data.results
    .filter((r) => r.media_type === "movie" || r.media_type === "tv")
    .map((r) => {
      const mediaType = r.media_type as TmdbMediaType;
      return {
        tmdbId: r.id,
        mediaType,
        title: (mediaType === "tv" ? r.name : r.title) ?? "Untitled",
        posterPath: r.poster_path ?? null,
        releaseYear: yearFrom(
          mediaType === "tv" ? r.first_air_date : r.release_date,
        ),
        overview: r.overview ?? "",
      };
    })
    .slice(0, 12);

  await writeCache(key, results, SEARCH_TTL_MS);
  return results;
}

interface RawDetail {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  overview?: string;
  runtime?: number; // movie
  episode_run_time?: number[]; // tv
  number_of_seasons?: number; // tv
  number_of_episodes?: number; // tv
  genres?: Array<{ name: string }>;
}

/** Full detail for one title — used when logging an entry (snapshots runtime + genres). */
export async function getTitle(
  mediaType: TmdbMediaType,
  tmdbId: number,
  signal?: AbortSignal,
): Promise<TmdbDetail | null> {
  const key = cacheKey("title", `${mediaType}:${tmdbId}`);
  const cached = await readCache<TmdbDetail>(key);
  if (cached) return cached;

  const data = await tmdbFetch<RawDetail>(
    `/${mediaType}/${tmdbId}?language=en-US`,
    signal,
  );
  if (!data) return null;

  const runtimeMinutes =
    mediaType === "movie"
      ? (data.runtime ?? null)
      : (data.episode_run_time?.[0] ?? null);

  const detail: TmdbDetail = {
    tmdbId: data.id,
    mediaType,
    title: (mediaType === "tv" ? data.name : data.title) ?? "Untitled",
    posterPath: data.poster_path ?? null,
    releaseYear: yearFrom(
      mediaType === "tv" ? data.first_air_date : data.release_date,
    ),
    overview: data.overview ?? "",
    runtimeMinutes: runtimeMinutes && runtimeMinutes > 0 ? runtimeMinutes : null,
    genres: (data.genres ?? []).map((g) => g.name).filter(Boolean),
    seasonsTotal: mediaType === "tv" ? (data.number_of_seasons ?? null) : null,
    episodesTotal: mediaType === "tv" ? (data.number_of_episodes ?? null) : null,
  };

  await writeCache(key, detail, DETAIL_TTL_MS);
  return detail;
}

import { cache } from "react";
import { eq, and, desc } from "drizzle-orm";
import { db } from "@/db/client";
import { watchEntries, type WatchEntry, type Watcher } from "@/db/schema";
import { safeDb } from "@/lib/blog/safe-db";
import { posterUrl } from "@/lib/movies/images";
import { getWatcherByHandle } from "@/lib/movies/identity";
import { computeStats, type ReelStats } from "@/lib/movies/stats";

/**
 * Reel store. Profiles are public-by-link, so most reads are ungated — but the
 * client-facing shapes deliberately OMIT the watcher's email (PII). Reads are
 * cache()-deduped and safeDb-guarded for the pre-migration window.
 */

export type WatchStatusValue = "watched" | "watching" | "watchlist";

/** Client-facing entry — resolved poster URL, no raw internal-only fields. */
export interface MovieCard {
  id: string;
  tmdbId: number;
  mediaType: "movie" | "tv";
  title: string;
  posterUrl: string | null;
  releaseYear: number | null;
  runtimeMinutes: number | null;
  genres: string[];
  status: WatchStatusValue;
  rating: number | null;
  seasonsTotal: number | null;
  episodesTotal: number | null;
  episodesWatched: number;
  watchedOn: string | null; // YYYY-MM-DD
  note: string | null;
  favorite: boolean;
  rewatches: number;
  createdAt: string; // ISO
}

/** Public watcher shape — no email. */
export interface PublicWatcher {
  handle: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
}

export function toCard(r: WatchEntry): MovieCard {
  return {
    id: r.id,
    tmdbId: r.tmdbId,
    mediaType: r.mediaType,
    title: r.title,
    posterUrl: posterUrl(r.posterPath),
    releaseYear: r.releaseYear,
    runtimeMinutes: r.runtimeMinutes,
    genres: r.genres,
    status: r.status,
    rating: r.rating,
    seasonsTotal: r.seasonsTotal,
    episodesTotal: r.episodesTotal,
    episodesWatched: r.episodesWatched,
    watchedOn: r.watchedOn,
    note: r.note,
    favorite: r.favorite,
    rewatches: r.rewatches,
    createdAt: r.createdAt.toISOString(),
  };
}

export function toPublicWatcher(w: Watcher): PublicWatcher {
  return {
    handle: w.handle,
    displayName: w.displayName,
    avatarUrl: w.avatarUrl,
    bio: w.bio,
  };
}

/** All of a watcher's entries (favorites first, then newest-logged). */
export const listEntries = cache(
  async (
    viewerId: string,
    opts?: { status?: WatchStatusValue },
  ): Promise<MovieCard[]> => {
    return safeDb(async () => {
      const where = opts?.status
        ? and(
            eq(watchEntries.viewerId, viewerId),
            eq(watchEntries.status, opts.status),
          )
        : eq(watchEntries.viewerId, viewerId);
      const rows = await db
        .select()
        .from(watchEntries)
        .where(where)
        .orderBy(desc(watchEntries.favorite), desc(watchEntries.createdAt));
      return rows.map(toCard);
    }, []);
  },
);

export interface ProfileData {
  watcher: PublicWatcher;
  entries: MovieCard[];
  stats: ReelStats;
}

/**
 * A public profile by handle: watcher (no email) + their watched/watching
 * entries + computed stats. Watchlist items are excluded from the public view
 * (a private queue), matching "log what you watched" being the shareable story.
 */
export const getPublicProfile = cache(
  async (handle: string): Promise<ProfileData | null> => {
    const watcher = await getWatcherByHandle(handle);
    if (!watcher) return null;
    const all = await listEntries(watcher.id);
    const entries = all.filter((e) => e.status !== "watchlist");
    return {
      watcher: toPublicWatcher(watcher),
      entries,
      stats: computeStats(entries),
    };
  },
);

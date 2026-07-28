import type { MovieCard } from "@/lib/movies/queries";

/**
 * Reel stats — pure aggregation over a set of entries (no DB, no secrets, safe
 * to compute on the server and hand the plain result to a client component).
 * Callers decide the scope: a public profile passes watched+watching entries;
 * the owner dashboard can pass everything.
 */

export interface GenreCount {
  genre: string;
  count: number;
}
export interface DecadeCount {
  decade: number; // e.g. 1990
  count: number;
}

export interface ReelStats {
  totalTitles: number;
  films: number;
  shows: number;
  totalMinutes: number; // includes rewatches
  thisYear: number; // titles with watchedOn in the current year
  favorites: number;
  rated: number; // how many carry a rating
  avgRating: number | null; // 1–10 scale
  avgStars: number | null; // avgRating / 2, one decimal
  ratingCounts: number[]; // index = rating value 1..10, [0] unused
  topGenres: GenreCount[]; // desc, capped
  decades: DecadeCount[]; // asc by decade
  nowWatching: MovieCard[];
  dayCounts: Record<string, number>; // YYYY-MM-DD → count logged that day
  activeDays: number; // distinct days with ≥1 watch
  longestStreak: number; // longest run of consecutive calendar days
  currentStreak: number; // run ending today or yesterday
  records: {
    longest: MovieCard | null;
    highestRated: MovieCard | null;
    oldest: MovieCard | null;
    mostRecent: MovieCard | null; // by watchedOn
  };
}

/** Add/subtract whole days from a YYYY-MM-DD string (UTC-safe). */
function shiftDay(ymd: string, delta: number): string {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

/** Longest + current run of consecutive days from a set of logged days. */
function streaks(days: Set<string>): { longest: number; current: number } {
  if (days.size === 0) return { longest: 0, current: 0 };
  const sorted = [...days].sort();
  let longest = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (shiftDay(sorted[i - 1], 1) === sorted[i]) {
      run++;
      longest = Math.max(longest, run);
    } else {
      run = 1;
    }
  }
  // Current streak: count back from today (or yesterday) while days are present.
  const today = new Date().toISOString().slice(0, 10);
  let cursor = days.has(today) ? today : shiftDay(today, -1);
  let current = 0;
  while (days.has(cursor)) {
    current++;
    cursor = shiftDay(cursor, -1);
  }
  return { longest, current };
}

export function computeStats(entries: MovieCard[]): ReelStats {
  const currentYear = new Date().getFullYear();

  let totalMinutes = 0;
  let films = 0;
  let shows = 0;
  let thisYear = 0;
  let favorites = 0;
  const ratingCounts = new Array<number>(11).fill(0);
  const ratingValues: number[] = [];
  const genreMap = new Map<string, number>();
  const decadeMap = new Map<number, number>();
  const dayCounts: Record<string, number> = {};
  const nowWatching: MovieCard[] = [];

  let longest: MovieCard | null = null;
  let highestRated: MovieCard | null = null;
  let oldest: MovieCard | null = null;
  let mostRecent: MovieCard | null = null;

  for (const e of entries) {
    if (e.mediaType === "movie") films++;
    else shows++;

    if (e.runtimeMinutes) {
      // TV: per-episode runtime × episodes watched. Movies: full runtime ×
      // (original + rewatches).
      totalMinutes +=
        e.mediaType === "tv"
          ? e.runtimeMinutes * (e.episodesWatched || 0)
          : e.runtimeMinutes * (1 + e.rewatches);
    }
    if (e.favorite) favorites++;
    if (e.status === "watching") nowWatching.push(e);

    if (e.watchedOn) {
      const day = e.watchedOn.slice(0, 10);
      dayCounts[day] = (dayCounts[day] ?? 0) + 1;
      if (Number(day.slice(0, 4)) === currentYear) thisYear++;
    }

    if (e.rating != null && e.rating >= 1 && e.rating <= 10) {
      ratingCounts[e.rating]++;
      ratingValues.push(e.rating);
      if (!highestRated || e.rating > (highestRated.rating ?? 0)) highestRated = e;
    }

    for (const g of e.genres) genreMap.set(g, (genreMap.get(g) ?? 0) + 1);

    if (e.releaseYear) {
      const decade = Math.floor(e.releaseYear / 10) * 10;
      decadeMap.set(decade, (decadeMap.get(decade) ?? 0) + 1);
      if (!oldest || e.releaseYear < (oldest.releaseYear ?? Infinity)) oldest = e;
    }

    if (e.runtimeMinutes && (!longest || e.runtimeMinutes > (longest.runtimeMinutes ?? 0)))
      longest = e;

    if (e.watchedOn && (!mostRecent || e.watchedOn > (mostRecent.watchedOn ?? "")))
      mostRecent = e;
  }

  const avgRating =
    ratingValues.length > 0
      ? ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length
      : null;

  const topGenres: GenreCount[] = [...genreMap.entries()]
    .map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const decades: DecadeCount[] = [...decadeMap.entries()]
    .map(([decade, count]) => ({ decade, count }))
    .sort((a, b) => a.decade - b.decade);

  const activeDaySet = new Set(Object.keys(dayCounts));
  const { longest: longestStreak, current: currentStreak } = streaks(activeDaySet);

  return {
    totalTitles: entries.length,
    films,
    shows,
    totalMinutes,
    thisYear,
    favorites,
    rated: ratingValues.length,
    avgRating,
    avgStars: avgRating != null ? Math.round((avgRating / 2) * 10) / 10 : null,
    ratingCounts,
    topGenres,
    decades,
    nowWatching,
    dayCounts,
    activeDays: activeDaySet.size,
    longestStreak,
    currentStreak,
    records: { longest, highestRated, oldest, mostRecent },
  };
}

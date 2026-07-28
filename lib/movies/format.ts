/**
 * Client-safe display helpers for the Reel tracker. Ratings are stored as an
 * integer 1–10 = a half-star scale (so 7 → 3½★). No secrets, no DB — safe to
 * import from client components.
 */

export const RATING_MAX = 10; // 10 half-steps = 5 stars

/** Whole + half + empty star counts for a 1–10 rating (null → all empty). */
export function ratingStars(rating: number | null): {
  full: number;
  half: number;
  empty: number;
} {
  const r = rating ?? 0;
  const full = Math.floor(r / 2);
  const half = r % 2 === 1 ? 1 : 0;
  const empty = 5 - full - half;
  return { full, half, empty };
}

/** "2h 46m" / "46m" / null. */
export function formatRuntime(minutes: number | null | undefined): string | null {
  if (!minutes || minutes <= 0) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/** Total minutes → a friendly hours string, e.g. "128 hrs" or "1,204 hrs". */
export function formatHours(totalMinutes: number): string {
  const hrs = Math.round(totalMinutes / 60);
  return `${hrs.toLocaleString("en-US")} hr${hrs === 1 ? "" : "s"}`;
}

export function mediaTypeLabel(t: "movie" | "tv"): string {
  return t === "tv" ? "TV" : "Film";
}

/**
 * Client-safe poster helpers. image.tmdb.org is a public CDN, so this needs no
 * secret — kept out of the server-only tmdb.ts so client components (search
 * results, poster grids) can build URLs too. Posters render via plain <img>
 * (no next/image remotePatterns config needed).
 */
const IMAGE_BASE = "https://image.tmdb.org/t/p";

export type PosterSize = "w92" | "w154" | "w185" | "w342" | "w500" | "w780";

export function posterUrl(
  path: string | null | undefined,
  size: PosterSize = "w342",
): string | null {
  return path ? `${IMAGE_BASE}/${size}${path}` : null;
}

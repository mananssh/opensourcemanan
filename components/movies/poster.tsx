import { mediaTypeLabel } from "@/lib/movies/format";

/**
 * A poster image with a graceful kraft-card fallback when TMDB has no art.
 * Plain <img> (TMDB is a CDN) so no next/image remotePatterns config is needed.
 */
export function Poster({
  url,
  title,
  mediaType,
  className = "",
  sizes,
}: {
  url: string | null;
  title: string;
  mediaType: "movie" | "tv";
  className?: string;
  sizes?: string;
}) {
  return (
    <div
      className={`relative aspect-[2/3] overflow-hidden rounded-sm border border-rule bg-surface ${className}`}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={`${title} poster`}
          loading="lazy"
          sizes={sizes}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 p-2 text-center">
          <span className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-faint">
            {mediaTypeLabel(mediaType)}
          </span>
          <span className="line-clamp-4 font-display text-sm font-medium text-muted">
            {title}
          </span>
        </div>
      )}
    </div>
  );
}

import type { MovieCard } from "@/lib/movies/queries";
import { Poster } from "@/components/movies/poster";
import { StaticStars } from "@/components/movies/star-rating";

/** A read-only wall of posters for a public profile. Favorites carry a heart. */
export function PosterGrid({ entries }: { entries: MovieCard[] }) {
  if (entries.length === 0) return null;
  return (
    <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
      {entries.map((e) => (
        <li key={e.id}>
          <figure className="group space-y-1.5">
            <div className="relative">
              <Poster
                url={e.posterUrl}
                title={e.title}
                mediaType={e.mediaType}
                sizes="(max-width: 640px) 33vw, 16vw"
              />
              {e.favorite && (
                <span
                  aria-label="Favorite"
                  className="absolute right-1 top-1 rounded-full bg-paper/85 px-1.5 text-sm leading-5 text-accent"
                >
                  ♥
                </span>
              )}
              {e.status === "watching" && (
                <span className="absolute left-1 top-1 rounded-full bg-accent px-1.5 py-0.5 font-mono text-[0.55rem] uppercase tracking-[0.12em] text-accent-ink">
                  Now
                </span>
              )}
            </div>
            <figcaption className="space-y-0.5">
              <p className="truncate font-body text-xs font-medium text-ink" title={e.title}>
                {e.title}
              </p>
              {e.rating != null ? (
                <StaticStars value={e.rating} size="h-3 w-3" />
              ) : (
                e.releaseYear && (
                  <p className="font-mono text-[0.6rem] text-faint">{e.releaseYear}</p>
                )
              )}
            </figcaption>
          </figure>
        </li>
      ))}
    </ul>
  );
}

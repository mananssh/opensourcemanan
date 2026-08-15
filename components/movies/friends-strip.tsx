import Link from "next/link";
import type { FriendWatch } from "@/lib/movies/follows";
import type { PublicWatcher } from "@/lib/movies/queries";
import { Poster } from "@/components/movies/poster";
import { StaticStars } from "@/components/movies/star-rating";
import { FindFriend } from "@/components/movies/find-friend";

function initialOf(w: PublicWatcher): string {
  return (w.displayName ?? w.handle).charAt(0).toUpperCase();
}

/**
 * The dashboard's social rail: who you follow + their most recent watches,
 * reverse-chronological, no ranking. Empty state nudges you to find a friend by
 * exact @handle. Server component (presentational).
 */
export function FriendsStrip({
  following,
  feed,
}: {
  following: PublicWatcher[];
  feed: FriendWatch[];
}) {
  return (
    <section className="border-t border-rule pt-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-faint">
          Following · {following.length}
        </h2>
        <div className="w-full max-w-xs">
          <FindFriend />
        </div>
      </div>

      {following.length === 0 ? (
        <p className="rounded-sm border border-dashed border-rule bg-surface px-4 py-8 text-center font-body text-muted">
          You&rsquo;re not following anyone yet. Know someone on Reel? Find them
          by their exact @handle above and follow from their profile.
        </p>
      ) : (
        <>
          {/* Followed watchers as avatar chips. */}
          <ul className="mb-6 flex flex-wrap gap-2">
            {following.map((w) => (
              <li key={w.handle}>
                <Link
                  href={`/movies/${w.handle}`}
                  className="inline-flex items-center gap-2 border border-rule bg-surface py-1 pl-1 pr-3 transition-colors hover:border-accent"
                >
                  <span className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-accent-soft text-xs font-bold text-accent">
                    {w.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={w.avatarUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      initialOf(w)
                    )}
                  </span>
                  <span className="font-mono text-[0.62rem] text-ink">@{w.handle}</span>
                </Link>
              </li>
            ))}
          </ul>

          {/* Recent watches from the people you follow. */}
          {feed.length > 0 && (
            <div>
              <p className="mb-3 font-mono text-[0.58rem] uppercase tracking-[0.2em] text-faint">
                Recently watched by friends
              </p>
              <ul className="flex snap-x gap-3 overflow-x-auto pb-2">
                {feed.map(({ entry, watcher }) => (
                  <li key={`${watcher.handle}-${entry.id}`} className="w-28 shrink-0 snap-start">
                    <Link href={`/movies/${watcher.handle}`} className="group block space-y-1.5">
                      <Poster
                        url={entry.posterUrl}
                        title={entry.title}
                        mediaType={entry.mediaType}
                      />
                      <div>
                        <p className="truncate font-body text-xs font-medium text-ink" title={entry.title}>
                          {entry.title}
                        </p>
                        <div className="flex items-center justify-between gap-1">
                          <span className="truncate font-mono text-[0.55rem] text-faint">
                            @{watcher.handle}
                          </span>
                          {entry.rating != null && <StaticStars value={entry.rating} size="h-2.5 w-2.5" />}
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}

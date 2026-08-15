import type { ReelStats } from "@/lib/movies/stats";
import { formatHours } from "@/lib/movies/format";
import { StaticStars } from "@/components/movies/star-rating";
import { Heatmap } from "@/components/movies/heatmap";
import { Poster } from "@/components/movies/poster";

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="border border-rule bg-surface px-4 py-3">
      <div className="font-display text-3xl font-bold leading-none text-ink">{value}</div>
      <div className="mt-1 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-faint">
        {label}
      </div>
    </div>
  );
}

/** A horizontal bar row for a distribution (genres / decades). */
function Bar({ label, count, max }: { label: string; count: number; max: number }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="w-16 shrink-0 truncate font-mono text-[0.62rem] uppercase tracking-[0.1em] text-muted">
        {label}
      </span>
      <span className="relative h-3 flex-1 overflow-hidden bg-paper">
        <span
          className="absolute inset-y-0 left-0 bg-accent"
          style={{ width: `${pct}%` }}
        />
      </span>
      <span className="w-6 shrink-0 text-right font-mono text-[0.62rem] text-faint">
        {count}
      </span>
    </div>
  );
}

/** Ratings distribution as vertical bars, one per star rung (1–5★). */
function Histogram({ ratingCounts }: { ratingCounts: number[] }) {
  // Fold the 1–10 half-star scale into 5 whole-star buckets for a compact chart.
  const buckets = [1, 2, 3, 4, 5].map((star) => ({
    star,
    count: (ratingCounts[star * 2 - 1] ?? 0) + (ratingCounts[star * 2] ?? 0),
  }));
  const max = Math.max(1, ...buckets.map((b) => b.count));
  return (
    <div className="flex h-24 items-end gap-2">
      {buckets.map((b) => (
        <div key={b.star} className="flex flex-1 flex-col items-center gap-1">
          <span className="font-mono text-[0.55rem] text-faint">{b.count || ""}</span>
          <span
            className="w-full rounded-t-[2px] bg-accent/80"
            style={{ height: `${Math.max(4, (b.count / max) * 100)}%` }}
          />
          <span className="font-mono text-[0.55rem] text-muted">{b.star}★</span>
        </div>
      ))}
    </div>
  );
}

/**
 * The "box office report" — a watcher's numbers. Presentational only (no hooks),
 * so it renders in the server profile page and inside the client dashboard alike.
 */
export function StatsPanel({ stats }: { stats: ReelStats }) {
  const genreMax = Math.max(1, ...stats.topGenres.map((g) => g.count));
  const decadeMax = Math.max(1, ...stats.decades.map((d) => d.count));
  const { records } = stats;

  if (stats.totalTitles === 0) return null;

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <Stat value={String(stats.totalTitles)} label="Titles" />
        <Stat value={String(stats.films)} label="Films" />
        <Stat value={String(stats.shows)} label="Shows" />
        <Stat value={formatHours(stats.totalMinutes)} label="Watched" />
        <Stat value={String(stats.thisYear)} label="This year" />
        <Stat
          value={stats.longestStreak > 1 ? `${stats.longestStreak}d` : String(stats.activeDays)}
          label={stats.longestStreak > 1 ? "Best streak" : "Active days"}
        />
      </div>

      {stats.nowWatching.length > 0 && (
        <div>
          <p className="mb-3 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-faint">
            Now watching
          </p>
          <ul className="flex gap-3 overflow-x-auto pb-1">
            {stats.nowWatching.map((e) => (
              <li key={e.id} className="w-20 shrink-0">
                <Poster url={e.posterUrl} title={e.title} mediaType={e.mediaType} />
                <p className="mt-1 truncate font-body text-[0.7rem] text-ink" title={e.title}>
                  {e.title}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {Object.keys(stats.dayCounts).length > 0 && <Heatmap dayCounts={stats.dayCounts} />}

      <div className="grid gap-6 sm:grid-cols-2">
        {stats.avgStars != null && (
          <div className="border border-rule bg-surface p-4">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-faint">
                Ratings
              </p>
              <span className="inline-flex items-center gap-2 font-mono text-[0.62rem] text-faint">
                <StaticStars value={Math.round(stats.avgRating ?? 0)} size="h-3.5 w-3.5" />
                <span className="font-display text-base font-bold text-ink">
                  {stats.avgStars.toFixed(1)}
                </span>
                / 5
              </span>
            </div>
            <div className="mt-3">
              <Histogram ratingCounts={stats.ratingCounts} />
            </div>
          </div>
        )}

        {stats.topGenres.length > 0 && (
          <div className="border border-rule bg-surface p-4">
            <p className="mb-2 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-faint">
              Top genres
            </p>
            <div className="space-y-1.5">
              {stats.topGenres.map((g) => (
                <Bar key={g.genre} label={g.genre} count={g.count} max={genreMax} />
              ))}
            </div>
          </div>
        )}

        {stats.decades.length > 0 && (
          <div className="border border-rule bg-surface p-4">
            <p className="mb-2 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-faint">
              By decade
            </p>
            <div className="space-y-1.5">
              {stats.decades.map((d) => (
                <Bar key={d.decade} label={`${d.decade}s`} count={d.count} max={decadeMax} />
              ))}
            </div>
          </div>
        )}

        {(records.longest || records.highestRated || records.oldest) && (
          <div className="border border-rule bg-surface p-4">
            <p className="mb-2 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-faint">
              Records
            </p>
            <dl className="space-y-1.5 font-body text-sm text-muted">
              {records.highestRated && (
                <div className="flex justify-between gap-3">
                  <dt className="text-faint">Top rated</dt>
                  <dd className="truncate text-right text-ink">{records.highestRated.title}</dd>
                </div>
              )}
              {records.longest?.runtimeMinutes && (
                <div className="flex justify-between gap-3">
                  <dt className="text-faint">Longest</dt>
                  <dd className="truncate text-right text-ink">{records.longest.title}</dd>
                </div>
              )}
              {records.oldest?.releaseYear && (
                <div className="flex justify-between gap-3">
                  <dt className="text-faint">Oldest</dt>
                  <dd className="truncate text-right text-ink">
                    {records.oldest.title} ({records.oldest.releaseYear})
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}
      </div>
    </section>
  );
}

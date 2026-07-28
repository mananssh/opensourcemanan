import type { ReelStats } from "@/lib/movies/stats";
import { formatHours } from "@/lib/movies/format";
import { StaticStars } from "@/components/movies/star-rating";

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
      <span className="relative h-3 flex-1 overflow-hidden rounded-full bg-paper">
        <span
          className="absolute inset-y-0 left-0 rounded-full bg-accent"
          style={{ width: `${pct}%` }}
        />
      </span>
      <span className="w-6 shrink-0 text-right font-mono text-[0.62rem] text-faint">
        {count}
      </span>
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
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <Stat value={String(stats.totalTitles)} label="Titles" />
        <Stat value={String(stats.films)} label="Films" />
        <Stat value={String(stats.shows)} label="Shows" />
        <Stat value={formatHours(stats.totalMinutes)} label="Watched" />
        <Stat value={String(stats.thisYear)} label="This year" />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {stats.avgStars != null && (
          <div className="border border-rule bg-surface p-4">
            <p className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-faint">
              Average rating
            </p>
            <div className="mt-2 flex items-center gap-3">
              <StaticStars value={Math.round((stats.avgRating ?? 0))} size="h-5 w-5" />
              <span className="font-display text-2xl font-bold text-ink">
                {stats.avgStars.toFixed(1)}
              </span>
              <span className="font-mono text-[0.62rem] text-faint">
                / 5 · {stats.rated} rated
              </span>
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

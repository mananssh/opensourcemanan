import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicProfile } from "@/lib/movies/queries";
import { computeStats } from "@/lib/movies/stats";
import { formatHours } from "@/lib/movies/format";
import { Poster } from "@/components/movies/poster";
import { ShareBar } from "@/components/movies/share-bar";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const profile = await getPublicProfile(handle);
  if (!profile) return { title: "Not found" };
  const name = profile.watcher.displayName ?? `@${profile.watcher.handle}`;
  return { title: `${name}'s year in film` };
}

/** A full-width recap card that rises in on load, sequenced by `index`. */
function Card({
  children,
  index,
  tone = "paper",
}: {
  children: React.ReactNode;
  index: number;
  tone?: "paper" | "accent" | "ink";
}) {
  const tones = {
    paper: "bg-surface text-ink border border-rule",
    accent: "bg-accent text-accent-ink",
    ink: "bg-ink text-paper",
  };
  return (
    <section
      className={`reel-wrapped-card flex min-h-[70vh] flex-col justify-center rounded-lg px-8 py-16 ${tones[tone]}`}
      style={{ animationDelay: `${index * 0.12}s` }}
    >
      {children}
    </section>
  );
}

export default async function WrappedPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const profile = await getPublicProfile(handle);
  if (!profile) notFound();

  const year = new Date().getFullYear();
  const thisYearEntries = profile.entries.filter(
    (e) => e.watchedOn && Number(e.watchedOn.slice(0, 4)) === year,
  );
  // Enough logged this year → a true "year in film"; else an all-time recap.
  const scoped = thisYearEntries.length >= 5;
  const entries = scoped ? thisYearEntries : profile.entries;
  const stats = computeStats(entries);
  const name = profile.watcher.displayName ?? `@${profile.watcher.handle}`;
  const label = scoped ? `${year} in film` : "The reel so far";

  const topRated = [...entries]
    .filter((e) => e.rating != null)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, 5);
  const showcase = (topRated.length ? topRated : entries).slice(0, 5);

  if (stats.totalTitles === 0) {
    return (
      <div className="mx-auto w-full max-w-2xl px-6 py-24 text-center">
        <h1 className="font-display text-4xl font-bold text-ink">Nothing to wrap yet.</h1>
        <p className="mt-4 font-body text-muted">
          @{profile.watcher.handle} hasn&rsquo;t logged anything.
        </p>
        <Link href={`/movies/${handle}`} className="mt-8 inline-block font-mono text-sm text-accent">
          ← Back to the reel
        </Link>
      </div>
    );
  }

  let i = 0;
  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-6 py-10 sm:py-16">
      <Card index={i++} tone="ink">
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.3em] text-accent">
          ●REC · Reel · Wrapped
        </p>
        <h1 className="vhs-title mt-4 font-display text-7xl leading-[0.9] tracking-[0.02em]">
          {name}&rsquo;s
          <br />
          {label}
          <span className="text-accent">.</span>
        </h1>
        <p className="mt-6 font-body text-lg opacity-80">A year at the movies, in numbers.</p>
      </Card>

      <Card index={i++}>
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.24em] text-faint">
          You watched
        </p>
        <p className="mt-3 font-display text-8xl font-bold leading-none text-ink">
          {stats.totalTitles}
        </p>
        <p className="mt-3 font-body text-xl text-muted">
          titles — {stats.films} films &amp; {stats.shows} shows.
        </p>
      </Card>

      <Card index={i++} tone="accent">
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.24em] opacity-80">
          That&rsquo;s
        </p>
        <p className="mt-3 font-display text-7xl font-bold leading-none">
          {formatHours(stats.totalMinutes)}
        </p>
        <p className="mt-3 font-body text-xl opacity-90">in front of the screen.</p>
      </Card>

      {stats.topGenres.length > 0 && (
        <Card index={i++}>
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.24em] text-faint">
            Your genre was
          </p>
          <p className="mt-3 font-display text-6xl font-bold leading-none text-ink">
            {stats.topGenres[0].genre}
          </p>
          <ul className="mt-6 space-y-1">
            {stats.topGenres.slice(0, 5).map((g, idx) => (
              <li key={g.genre} className="flex justify-between font-mono text-sm text-muted">
                <span>
                  {idx + 1}. {g.genre}
                </span>
                <span className="text-faint">{g.count}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {stats.avgStars != null && (
        <Card index={i++} tone="accent">
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.24em] opacity-80">
            You rated on average
          </p>
          <p className="mt-3 font-display text-7xl font-bold leading-none">
            {stats.avgStars.toFixed(1)}★
          </p>
          {stats.records.highestRated && (
            <p className="mt-4 font-body text-lg opacity-90">
              Your top pick: <strong>{stats.records.highestRated.title}</strong>
            </p>
          )}
        </Card>
      )}

      {showcase.length > 0 && (
        <Card index={i++}>
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.24em] text-faint">
            The highlights
          </p>
          <ul className="mt-5 flex gap-3 overflow-x-auto pb-2">
            {showcase.map((e) => (
              <li key={e.id} className="w-28 shrink-0">
                <Poster url={e.posterUrl} title={e.title} mediaType={e.mediaType} />
                <p className="mt-1 truncate font-body text-xs text-ink" title={e.title}>
                  {e.title}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card index={i++} tone="ink">
        <p className="font-display text-4xl font-bold">That&rsquo;s a wrap.</p>
        <p className="mt-3 font-body text-lg opacity-80">Share your ticket stub:</p>
        <div className="mt-6">
          <ShareBar handle={handle} />
        </div>
        <Link
          href={`/movies/${handle}`}
          className="mt-8 inline-block font-mono text-[0.7rem] uppercase tracking-[0.16em] text-accent"
        >
          ← Back to the reel
        </Link>
      </Card>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicProfile } from "@/lib/movies/queries";
import { getViewer } from "@/lib/movies/identity";
import { formatHours } from "@/lib/movies/format";
import { StatsPanel } from "@/components/movies/stats-panel";
import { PosterGrid } from "@/components/movies/poster-grid";
import { CopyLink } from "@/components/movies/copy-link";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const profile = await getPublicProfile(handle);
  if (!profile) return { title: "Not found" };
  const name = profile.watcher.displayName ?? `@${profile.watcher.handle}`;
  return {
    title: `${name}'s reel`,
    description:
      profile.watcher.bio ??
      `${name} has logged ${profile.stats.totalTitles} titles on Reel.`,
  };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const profile = await getPublicProfile(handle);
  if (!profile) notFound();

  const { watcher, entries, stats } = profile;
  const viewer = await getViewer();
  const isOwner = viewer?.handle === watcher.handle;
  const name = watcher.displayName ?? `@${watcher.handle}`;
  const initial = (watcher.displayName ?? watcher.handle).charAt(0).toUpperCase();

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10 sm:py-14">
      <header className="flex flex-col gap-5 border-b border-rule pb-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-ink bg-accent-soft">
            {watcher.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={watcher.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="font-display text-2xl font-bold text-accent">{initial}</span>
            )}
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-ink">{name}</h1>
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-faint">
              @{watcher.handle}
              {" · "}
              {stats.totalTitles} titles · {formatHours(stats.totalMinutes)}
              {stats.thisYear > 0 ? ` · ${stats.thisYear} this year` : ""}
            </p>
            {watcher.bio && (
              <p className="mt-2 max-w-md font-body text-sm leading-relaxed text-muted">
                {watcher.bio}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CopyLink handle={watcher.handle} />
          {isOwner && (
            <Link
              href="/movies"
              className="inline-flex h-9 items-center rounded-full border border-rule px-4 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-muted transition-colors hover:border-accent hover:text-accent"
            >
              Manage
            </Link>
          )}
        </div>
      </header>

      {stats.totalTitles === 0 ? (
        <p className="mt-16 text-center font-body text-muted">
          {isOwner ? "You haven't" : `@${watcher.handle} hasn't`} logged anything yet.
        </p>
      ) : (
        <div className="mt-10 space-y-12">
          <StatsPanel stats={stats} />
          <section>
            <h2 className="mb-4 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-faint">
              The reel · {entries.length}
            </h2>
            <PosterGrid entries={entries} />
          </section>
        </div>
      )}
    </div>
  );
}

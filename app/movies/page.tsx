import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/lib/auth";
import { getViewer } from "@/lib/movies/identity";
import { listEntries } from "@/lib/movies/queries";
import { listFollowing, getFriendsFeed } from "@/lib/movies/follows";
import { SubmitButton } from "@/components/blog/submit-button";
import { EntryLibrary } from "@/components/movies/entry-library";
import { FriendsStrip } from "@/components/movies/friends-strip";

export default async function MoviesHome() {
  const session = await auth();

  if (!session?.user) return <Landing />;

  const viewer = await getViewer();
  if (!viewer) redirect("/movies/welcome");

  const [entries, following, feed] = await Promise.all([
    listEntries(viewer.id),
    listFollowing(viewer.id),
    getFriendsFeed(viewer.id),
  ]);

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10 sm:py-14">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.24em] text-accent-2">
            ●REC · Now showing
          </p>
          <h1 className="vhs-title mt-1 font-display text-5xl tracking-[0.03em] text-ink">
            {viewer.displayName ?? `@${viewer.handle}`}
            <span className="text-accent">.</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/movies/${viewer.handle}`}
            className="inline-flex h-9 items-center rounded-full border border-rule px-4 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-muted transition-colors hover:border-accent hover:text-accent"
          >
            View reel
          </Link>
          <Link
            href="/movies/settings"
            className="inline-flex h-9 items-center rounded-full border border-rule px-4 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-muted transition-colors hover:border-accent hover:text-accent"
          >
            Settings
          </Link>
        </div>
      </div>

      <EntryLibrary initialEntries={entries} />

      <div className="mt-12">
        <FriendsStrip following={following} feed={feed} />
      </div>
    </div>
  );
}

function Landing() {
  const features = [
    ["One-tap logging", "Search a title, tap it, done. Built to be a habit, not a chore."],
    ["Your box-office report", "Hours watched, top genres, decades, ratings — your taste, quantified."],
    ["Follow by @handle", "No feed, no algorithm. Add friends you actually know and pin their reels."],
  ];
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-16 sm:py-24">
      <p className="font-mono text-[0.62rem] uppercase tracking-[0.28em] text-accent-2">
        ●REC · SP · 0:00:00
      </p>
      <h1 className="vhs-title mt-4 font-display text-6xl leading-[0.95] tracking-[0.02em] text-ink sm:text-7xl">
        Keep the reel of
        <br />
        everything you watch<span className="text-accent">.</span>
      </h1>
      <p className="mt-6 max-w-xl font-body text-lg leading-relaxed text-muted">
        A retro logbook for films &amp; TV. Rate them, stack the stats, and share
        a ticket-stub of your taste. Sign in to start yours.
      </p>

      <form
        action={async () => {
          "use server";
          await signIn("google", { redirectTo: "/movies" });
        }}
      >
        <SubmitButton
          className="mt-8 inline-flex items-center gap-3 rounded-full bg-accent px-6 py-3 font-mono text-sm uppercase tracking-[0.12em] text-accent-ink transition-opacity hover:opacity-90"
          pendingLabel="Redirecting…"
        >
          <span aria-hidden>◈</span> Continue with Google
        </SubmitButton>
      </form>

      <ul className="mt-16 space-y-6 border-t border-rule pt-10">
        {features.map(([title, desc]) => (
          <li key={title} className="flex gap-4">
            <span aria-hidden className="mt-1 font-display text-accent">
              ◆
            </span>
            <div>
              <h2 className="font-display text-xl font-semibold text-ink">{title}</h2>
              <p className="mt-1 font-body text-muted">{desc}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

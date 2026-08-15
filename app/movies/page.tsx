import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/lib/auth";
import { getViewer } from "@/lib/movies/identity";
import { listEntries } from "@/lib/movies/queries";
import { listFollowing, getFriendsFeed } from "@/lib/movies/follows";
import { SubmitButton } from "@/components/blog/submit-button";
import { EntryLibrary } from "@/components/movies/entry-library";
import { FriendsStrip } from "@/components/movies/friends-strip";
import { ReelHero } from "@/components/movies/reel-hero";

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
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.24em] text-accent-2">
            Now showing
          </p>
          <h1 className="reel-wordmark mt-1 font-display text-[clamp(2.75rem,8vw,5rem)] text-ink">
            {viewer.displayName ?? `@${viewer.handle}`}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/movies/${viewer.handle}`}
            className="inline-flex h-9 items-center border border-rule px-4 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-muted transition-colors hover:border-accent hover:text-accent"
          >
            View reel
          </Link>
          <Link
            href="/movies/settings"
            className="inline-flex h-9 items-center border border-rule px-4 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-muted transition-colors hover:border-accent hover:text-accent"
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
    ["01", "Log it", "Search a title, tap it, done. A habit, not a chore."],
    ["02", "The report", "Hours, genres, decades, ratings — taste, counted."],
    ["03", "Follow @handle", "No feed. Add people you know and pin their reels."],
  ];
  return (
    <div className="mx-auto w-full max-w-5xl px-6 pb-[clamp(4rem,12vh,8rem)] pt-10 sm:pt-16">
      <ReelHero
        cta={
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/movies" });
            }}
          >
            <SubmitButton
              className="inline-flex items-center border border-accent bg-accent px-7 py-3.5 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-accent-ink transition-colors hover:bg-transparent hover:text-accent"
              pendingLabel="Redirecting…"
            >
              Continue with Google
            </SubmitButton>
          </form>
        }
      />

      <ol className="mt-[clamp(4rem,12vh,7rem)] divide-y divide-rule border-y border-rule">
        {features.map(([n, title, desc]) => (
          <li key={n} className="grid gap-2 py-8 sm:grid-cols-[4rem_1fr] sm:items-baseline sm:gap-8">
            <span className="font-mono text-[0.65rem] tracking-[0.18em] text-faint">{n}</span>
            <div>
              <h2 className="reel-wordmark font-display text-2xl text-ink sm:text-3xl">
                {title}
              </h2>
              <p className="mt-2 max-w-lg text-muted">{desc}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

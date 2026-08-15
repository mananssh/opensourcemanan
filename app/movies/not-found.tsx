import Link from "next/link";

export default function MoviesNotFound() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-24">
      <p className="font-mono text-[0.62rem] uppercase tracking-[0.28em] text-accent">
        Lot empty
      </p>
      <h1 className="reel-wordmark mt-4 font-display text-[clamp(2.75rem,8vw,4.5rem)] text-ink">
        Not showing
      </h1>
      <p className="mt-4 max-w-md text-muted">
        That handle isn&rsquo;t on the lot. Check the spelling, or start yours.
      </p>
      <Link
        href="/movies"
        className="mt-10 inline-flex items-center border border-rule px-5 py-2.5 font-mono text-[0.7rem] uppercase tracking-[0.16em] text-muted transition-colors hover:border-accent hover:text-accent"
      >
        ← Back to Reel
      </Link>
    </div>
  );
}

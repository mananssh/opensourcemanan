import Link from "next/link";

export default function MoviesNotFound() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-24 text-center">
      <p className="font-mono text-[0.62rem] uppercase tracking-[0.28em] text-accent">
        ▐▪▐ No ticket
      </p>
      <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-ink">
        Reel not found<span className="text-accent">.</span>
      </h1>
      <p className="mx-auto mt-4 max-w-md font-body text-muted">
        That handle isn&rsquo;t showing anything. Check the spelling, or start
        your own.
      </p>
      <Link
        href="/movies"
        className="mt-8 inline-flex items-center rounded-full border border-rule px-5 py-2 font-mono text-sm text-muted transition-colors hover:border-accent hover:text-accent"
      >
        ← Back to Reel
      </Link>
    </div>
  );
}

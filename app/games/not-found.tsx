import Link from "next/link";

export default function GamesNotFound() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-24 text-center">
      <p className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-accent">
        Missing
      </p>
      <h1 className="arcd-wordmark mt-4 font-display text-4xl font-bold text-ink">
        Not on the floor
      </h1>
      <p className="mx-auto mt-4 max-w-md text-muted">
        That title isn&rsquo;t in the ARCD registry.
      </p>
      <Link
        href="/games"
        className="mt-8 inline-flex cursor-pointer items-center rounded-full border border-rule px-5 py-2 font-mono text-[0.7rem] uppercase tracking-[0.15em] text-muted transition-colors hover:border-accent hover:text-accent"
      >
        ← ARCD
      </Link>
    </div>
  );
}

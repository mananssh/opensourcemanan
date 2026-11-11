import Link from "next/link";

export default function GamesNotFound() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-24">
      <p className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-accent">
        Error · cabinet missing
      </p>
      <h1 className="arcd-wordmark mt-4 font-display text-[clamp(2.5rem,8vw,4.5rem)] font-bold text-ink">
        Offline
      </h1>
      <p className="mt-4 max-w-md text-muted">
        That title isn&rsquo;t in the ARCD registry.
      </p>
      <Link
        href="/games"
        className="mt-10 inline-flex cursor-pointer items-center border border-rule px-5 py-2.5 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-muted transition-colors hover:border-accent hover:text-accent"
      >
        ← Back to ARCD
      </Link>
    </div>
  );
}

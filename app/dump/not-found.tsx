import Link from "next/link";

export default function DumpNotFound() {
  return (
    <div className="mx-auto w-full max-w-xl px-6 pb-28 pt-24 text-center">
      <h1 className="font-display text-6xl font-bold text-ink">
        Lost note<span className="text-accent">.</span>
      </h1>
      <p className="mt-3 font-body text-2xl text-muted">
        That thought isn&rsquo;t on the wall.
      </p>
      <Link
        href="/dump"
        className="mt-8 inline-block font-mono text-xs uppercase tracking-[0.2em] text-muted transition-colors hover:text-accent"
      >
        ← the whole wall
      </Link>
    </div>
  );
}

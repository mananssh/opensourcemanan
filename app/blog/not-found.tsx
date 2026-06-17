import Link from "next/link";

export default function BlogNotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-5xl flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-faint">
        404
      </p>
      <h1 className="font-display text-6xl font-extrabold uppercase tracking-tight text-ink">
        Empty rabbit hole<span className="text-accent">.</span>
      </h1>
      <Link
        href="/blog"
        className="font-mono text-xs uppercase tracking-[0.2em] text-accent transition-opacity hover:opacity-70"
      >
        ← all posts
      </Link>
    </div>
  );
}

import Link from "next/link";

/**
 * Shared footer for every vertical (e.g. /blog). Verticals stay visually
 * independent — this renders with semantic tokens, so it picks up each
 * vertical's own theme (.vertical-blog etc.). What's common is the *union*: a
 * quiet way back to the OSM home and the changelog. New verticals reuse this
 * rather than reimplementing footer nav.
 */
const linkClass =
  "inline-flex h-8 items-center rounded-full border border-rule px-3.5 font-mono text-[0.7rem] uppercase tracking-[0.15em] text-muted transition-colors hover:border-accent hover:text-accent";

export function VerticalFooter({ tagline }: { tagline: string }) {
  return (
    <footer className="border-t border-rule">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <span className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-faint">
          {tagline}
        </span>
        <nav className="flex items-center gap-2.5">
          <Link href="/" className={linkClass}>
            ← OSM
          </Link>
          <Link href="/changelog" className={linkClass}>
            Changelog
          </Link>
        </nav>
      </div>
    </footer>
  );
}

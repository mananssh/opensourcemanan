import Link from "next/link";
import type { Category } from "@/db/schema";

/**
 * Compact wayfinding chips for the blog masthead — one pill per category, each
 * carrying its own accent color as a dot so the categories read as distinct
 * "channels" without needing the full Spotify tile. Sits high on the index so
 * browsing by topic is always the first thing in reach.
 */
export function CategoryChips({ categories }: { categories: Category[] }) {
  if (categories.length === 0) return null;

  return (
    <nav aria-label="Browse by category" className="flex flex-wrap gap-2">
      {categories.map((c) => (
        <Link
          key={c.id}
          href={`/blog/category/${c.slug}`}
          className="group inline-flex items-center gap-2 rounded-full border border-rule bg-surface px-3.5 py-1.5 font-mono text-xs uppercase tracking-[0.15em] text-muted transition-colors hover:border-accent hover:text-ink"
        >
          <span
            aria-hidden
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: c.accentColor }}
          />
          {c.name}
        </Link>
      ))}
    </nav>
  );
}

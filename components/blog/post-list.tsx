import Link from "next/link";
import type { PostCard } from "@/lib/blog/queries";

function fmtDate(d: Date | null): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** The Kinetic-Mono post list, shared by the blog index and category pages. */
export function PostList({
  posts,
  showCategory = true,
}: {
  posts: PostCard[];
  showCategory?: boolean;
}) {
  if (posts.length === 0) {
    return (
      <p className="border-t border-rule py-20 font-mono text-sm uppercase tracking-[0.2em] text-faint">
        No posts yet — check back soon.
      </p>
    );
  }

  return (
    <ol className="border-t border-rule pb-28">
      {posts.map((p, i) => (
        <li key={p.id} className="border-b border-rule">
          <Link
            href={`/blog/${p.slug}`}
            className="group grid grid-cols-[3rem_1fr] gap-4 py-8 sm:grid-cols-[4rem_1fr_auto] sm:gap-8"
          >
            <span className="font-mono text-sm text-faint tabular-nums">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <h2 className="font-display text-3xl font-bold leading-[1.05] tracking-tight text-ink transition-colors group-hover:text-accent sm:text-4xl">
                {p.title}
              </h2>
              {p.excerpt && (
                <p className="mt-3 line-clamp-2 max-w-2xl border-l-2 border-rule pl-4 font-body text-base italic leading-relaxed text-muted transition-colors group-hover:border-accent">
                  {p.excerpt}
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[0.7rem] uppercase tracking-[0.15em] text-faint">
                {showCategory && p.category && (
                  <span className="text-accent">{p.category.name}</span>
                )}
                {p.publishedAt && <span>{fmtDate(p.publishedAt)}</span>}
                <span>{p.readingMinutes} min</span>
              </div>
            </div>
            <span
              aria-hidden
              className="hidden self-center font-mono text-2xl text-muted transition-transform group-hover:translate-x-1 group-hover:text-accent sm:block"
            >
              →
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}

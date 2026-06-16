import Link from "next/link";
import { listVisiblePosts, listVisibleCategories } from "@/lib/blog/queries";
import { PostList } from "@/components/blog/post-list";

export const metadata = {
  title: "Blog",
  description: "Writing, in the open — notes, builds, and experiments.",
};

export default async function BlogIndex() {
  const [posts, categories] = await Promise.all([
    listVisiblePosts(),
    listVisibleCategories(),
  ]);

  return (
    <div className="mx-auto w-full max-w-5xl px-6">
      {/* Kinetic masthead */}
      <header className="pt-20 pb-16 sm:pt-28">
        <p
          className="reveal font-mono text-xs uppercase tracking-[0.25em] text-faint"
          style={{ "--reveal-delay": "0ms" } as React.CSSProperties}
        >
          OSM — Journal
        </p>
        <h1
          className="reveal mt-4 font-display text-[18vw] font-extrabold uppercase leading-[0.82] tracking-[-0.03em] text-ink sm:text-[10rem]"
          style={{ "--reveal-delay": "70ms" } as React.CSSProperties}
        >
          Writing<span className="text-accent">.</span>
        </h1>
        <p
          className="reveal mt-6 max-w-xl font-body text-lg leading-relaxed text-muted"
          style={{ "--reveal-delay": "180ms" } as React.CSSProperties}
        >
          Notes, builds, and experiments — thinking out loud, in public.
        </p>

        {categories.length > 0 && (
          <ul
            className="reveal mt-8 flex flex-wrap gap-2"
            style={{ "--reveal-delay": "280ms" } as React.CSSProperties}
          >
            {categories.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/blog/category/${c.slug}`}
                  className="inline-flex rounded-full border border-rule px-3 py-1 font-mono text-[0.7rem] uppercase tracking-[0.15em] text-muted transition-colors hover:border-accent hover:text-accent"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </header>

      <PostList posts={posts} />
    </div>
  );
}

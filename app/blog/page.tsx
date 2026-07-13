import Link from "next/link";
import {
  listVisiblePosts,
  listVisibleCategories,
  listFeaturedPosts,
} from "@/lib/blog/queries";
import { PostList } from "@/components/blog/post-list";
import { CategoryChips } from "@/components/blog/category-chips";
import { FeaturedHero } from "@/components/blog/featured-hero";
import { NewsletterForm } from "@/components/blog/newsletter-form";

const PAGE_SIZE = 9;

export const metadata = {
  title: "Blog",
  description:
    "Deep dives into whatever I'm currently obsessed with — no single topic, just things worth thinking hard about.",
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-6 font-mono text-xs uppercase tracking-[0.25em] text-faint">
      {children}
    </h2>
  );
}

export default async function BlogIndex({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const [allPosts, categories, featured] = await Promise.all([
    listVisiblePosts(),
    listVisibleCategories(),
    listFeaturedPosts(),
  ]);

  // The top featured post is spotlit as the hero; it's pulled out of the Latest
  // list on every page so pagination counts stay stable and it doesn't repeat.
  const hero = featured[0] ?? null;
  const rest = hero ? allPosts.filter((p) => p.id !== hero.id) : allPosts;

  const totalPages = Math.max(1, Math.ceil(rest.length / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const posts = rest.slice(start, start + PAGE_SIZE);
  const showHero = page === 1 && hero !== null;

  return (
    <div className="mx-auto w-full max-w-5xl px-6 pb-28">
      {/* Kinetic masthead */}
      <header className="pt-20 pb-16 sm:pt-28">
        <p
          className="reveal font-mono text-xs uppercase tracking-[0.25em] text-faint"
          style={{ "--reveal-delay": "0ms" } as React.CSSProperties}
        >
          OSM — The Blog
        </p>
        <h1
          className="reveal mt-4 font-display text-[16vw] font-extrabold uppercase leading-[0.8] tracking-[-0.03em] text-ink sm:text-[8.5rem]"
          style={{ "--reveal-delay": "70ms" } as React.CSSProperties}
        >
          Rabbit
          <br />
          holes<span className="text-accent">.</span>
        </h1>
        <p
          className="reveal mt-6 max-w-xl font-body text-lg leading-relaxed text-muted"
          style={{ "--reveal-delay": "180ms" } as React.CSSProperties}
        >
          Deep dives into whatever I&rsquo;m currently obsessed with. No single
          topic — just things worth thinking hard about.
        </p>

        <form
          action="/blog/search"
          method="get"
          className="reveal mt-8 max-w-md"
          style={{ "--reveal-delay": "230ms" } as React.CSSProperties}
        >
          <input
            name="q"
            placeholder="Search posts…"
            aria-label="Search posts"
            className="w-full rounded-full border border-rule bg-surface px-4 py-2 font-mono text-sm text-ink transition-colors placeholder:text-faint focus:border-accent"
          />
        </form>

        {categories.length > 0 && (
          <div
            className="reveal mt-8"
            style={{ "--reveal-delay": "280ms" } as React.CSSProperties}
          >
            <CategoryChips categories={categories} />
          </div>
        )}
      </header>

      {showHero && hero && (
        <section className="mb-20">
          <SectionLabel>Featured</SectionLabel>
          <FeaturedHero post={hero} />
        </section>
      )}

      {(posts.length > 0 || !showHero) && (
        <section>
          <SectionLabel>{page === 1 ? "Latest" : `Posts — page ${page}`}</SectionLabel>
          <PostList posts={posts} />
          {totalPages > 1 && (
            <nav
              aria-label="Pagination"
              className="mt-12 flex items-center justify-between font-mono text-xs uppercase tracking-[0.18em]"
            >
              {page > 1 ? (
                <Link
                  href={page === 2 ? "/blog" : `/blog?page=${page - 1}`}
                  className="text-muted transition-colors hover:text-accent"
                >
                  ← Newer
                </Link>
              ) : (
                <span />
              )}
              <span className="text-faint">
                {page} / {totalPages}
              </span>
              {page < totalPages ? (
                <Link
                  href={`/blog?page=${page + 1}`}
                  className="text-muted transition-colors hover:text-accent"
                >
                  Older →
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}
        </section>
      )}

      <section className="mt-20 border-t border-rule pt-12">
        <h2 className="font-display text-2xl font-bold text-ink">
          New posts, in your inbox
        </h2>
        <p className="mt-2 mb-6 max-w-md font-body text-muted">
          No spam — just a note when something new goes up.
        </p>
        <div className="max-w-lg">
          <NewsletterForm />
        </div>
      </section>
    </div>
  );
}

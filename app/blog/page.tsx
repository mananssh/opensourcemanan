import { listVisiblePosts, listVisibleCategories } from "@/lib/blog/queries";
import { PostList } from "@/components/blog/post-list";
import { CategoryTiles } from "@/components/blog/category-tiles";

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

export default async function BlogIndex() {
  const [posts, categories] = await Promise.all([
    listVisiblePosts(),
    listVisibleCategories(),
  ]);

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
      </header>

      {categories.length > 0 && (
        <section className="reveal mb-20" style={{ "--reveal-delay": "260ms" } as React.CSSProperties}>
          <SectionLabel>Browse</SectionLabel>
          <CategoryTiles categories={categories} />
        </section>
      )}

      <section>
        <SectionLabel>Latest</SectionLabel>
        <PostList posts={posts} />
      </section>
    </div>
  );
}

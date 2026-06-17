import { searchVisiblePosts } from "@/lib/blog/queries";
import { PostList } from "@/components/blog/post-list";

export const metadata = { title: "Search" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const term = q.trim();
  const results = term ? await searchVisiblePosts(term) : [];

  return (
    <div className="mx-auto w-full max-w-5xl px-6 pt-20 sm:pt-28">
      <header className="pb-12">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-faint">
          Search
        </p>
        <form action="/blog/search" method="get" className="mt-4">
          <input
            name="q"
            defaultValue={q}
            autoFocus
            aria-label="Search posts"
            placeholder="Search posts…"
            className="w-full border-b-2 border-rule bg-transparent pb-2 font-display text-3xl text-ink placeholder:text-faint focus:border-accent sm:text-4xl"
          />
        </form>
        {term && (
          <p className="mt-5 font-mono text-xs uppercase tracking-[0.2em] text-faint">
            {results.length} result{results.length === 1 ? "" : "s"} for &ldquo;{term}&rdquo;
          </p>
        )}
      </header>
      {term && <PostList posts={results} />}
    </div>
  );
}

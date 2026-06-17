import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getVisibleCategory, listVisiblePosts } from "@/lib/blog/queries";
import { PostList } from "@/components/blog/post-list";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getVisibleCategory(slug);
  if (!category) return { title: "Not found" };
  const description = category.description ?? undefined;
  return {
    title: category.name,
    description,
    alternates: {
      canonical: `/blog/category/${slug}`,
      types:
        category.visibility === "public"
          ? {
              "application/rss+xml": [
                { url: `/blog/category/${slug}/feed.xml`, title: category.name },
              ],
            }
          : undefined,
    },
    openGraph: { title: category.name, description, type: "website" },
  };
}

export default async function CategoryPage({ params }: { params: Params }) {
  const { slug } = await params;
  const category = await getVisibleCategory(slug);
  if (!category) notFound();

  const posts = await listVisiblePosts({ categorySlug: slug });

  return (
    <div className="mx-auto w-full max-w-5xl px-6">
      <header className="pt-20 pb-14 sm:pt-28">
        <p className="reveal font-mono text-xs uppercase tracking-[0.25em] text-faint">
          Category
        </p>
        <h1 className="reveal mt-4 font-display text-6xl font-extrabold uppercase leading-[0.85] tracking-[-0.03em] text-ink sm:text-8xl">
          {category.name}
          <span className="text-accent">.</span>
        </h1>
        {category.description && (
          <p className="reveal mt-6 max-w-xl font-body text-lg leading-relaxed text-muted">
            {category.description}
          </p>
        )}
      </header>

      <PostList posts={posts} showCategory={false} />
    </div>
  );
}

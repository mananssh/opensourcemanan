import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTag, listPostsByTag } from "@/lib/blog/queries";
import { PostList } from "@/components/blog/post-list";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const tag = await getTag(slug);
  return { title: tag ? `#${tag.name}` : "Not found" };
}

export default async function TagPage({ params }: { params: Params }) {
  const { slug } = await params;
  const tag = await getTag(slug);
  if (!tag) notFound();
  const posts = await listPostsByTag(slug);

  return (
    <div className="mx-auto w-full max-w-5xl px-6">
      <header className="pt-20 pb-14 sm:pt-28">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-faint">
          Tag
        </p>
        <h1 className="mt-4 font-display text-6xl font-extrabold uppercase leading-[0.85] tracking-[-0.03em] text-ink sm:text-8xl">
          #{tag.name}
          <span className="text-accent">.</span>
        </h1>
      </header>
      <PostList posts={posts} />
    </div>
  );
}

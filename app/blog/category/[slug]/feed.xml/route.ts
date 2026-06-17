import {
  listPublicPostsForFeed,
  listPublicCategories,
} from "@/lib/blog/queries";
import { renderRss } from "@/lib/blog/feed";
import { siteUrl, blogTitle, blogDescription } from "@/lib/site";

// Regenerate at most hourly so new posts appear without a redeploy.
export const revalidate = 3600;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  // Only public categories get a feed; gated ones 404 (no existence leak).
  const isPublic = (await listPublicCategories()).some((c) => c.slug === slug);
  if (!isPublic) return new Response("Not found", { status: 404 });

  const items = await listPublicPostsForFeed({ categorySlug: slug });
  const name = items[0]?.category?.name ?? slug;
  const xml = renderRss({
    title: `${blogTitle} — ${name}`,
    description: blogDescription,
    feedUrl: `${siteUrl}/blog/category/${slug}/feed.xml`,
    link: `${siteUrl}/blog/category/${slug}`,
    items,
  });
  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}

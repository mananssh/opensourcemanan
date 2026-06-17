import { listPublicPostsForFeed } from "@/lib/blog/queries";
import { renderJsonFeed } from "@/lib/blog/feed";
import { siteUrl, blogTitle, blogDescription } from "@/lib/site";

// Regenerate at most hourly so new posts appear without a redeploy.
export const revalidate = 3600;

export async function GET() {
  const items = await listPublicPostsForFeed();
  const feed = renderJsonFeed({
    title: blogTitle,
    description: blogDescription,
    feedUrl: `${siteUrl}/blog/feed.json`,
    items,
  });
  return Response.json(feed, {
    headers: { "Content-Type": "application/feed+json; charset=utf-8" },
  });
}

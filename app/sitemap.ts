import type { MetadataRoute } from "next";
import { listPublicPosts } from "@/lib/blog/queries";
import { siteUrl } from "@/lib/site";

// Regenerate hourly so published posts appear without a redeploy (DA #2).
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await listPublicPosts();
  const staticRoutes: MetadataRoute.Sitemap = ["", "/osm", "/changelog", "/blog"].map(
    (path) => ({ url: `${siteUrl}${path}`, lastModified: new Date() }),
  );
  const postRoutes: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${siteUrl}/blog/${p.slug}`,
    lastModified: p.updatedAt ?? undefined,
  }));
  return [...staticRoutes, ...postRoutes];
}

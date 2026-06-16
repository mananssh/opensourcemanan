import type { MetadataRoute } from "next";
import { listPublicPosts } from "@/lib/blog/queries";
import { siteUrl } from "@/lib/site";

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

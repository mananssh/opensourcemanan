import type { MetadataRoute } from "next";
import {
  listPublicPosts,
  listPublicCategories,
  listPublicTagSlugs,
} from "@/lib/blog/queries";
import { siteUrl } from "@/lib/site";

// Regenerate hourly so published posts appear without a redeploy.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, categories, tagSlugs] = await Promise.all([
    listPublicPosts(),
    listPublicCategories(),
    listPublicTagSlugs(),
  ]);

  // Static routes carry no lastModified — a real "now()" every regeneration is
  // meaningless churn that just tells crawlers to recrawl unchanged pages.
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/osm`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/changelog`, changeFrequency: "weekly", priority: 0.5 },
    { url: `${siteUrl}/blog`, changeFrequency: "daily", priority: 0.8 },
  ];

  const postRoutes: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${siteUrl}/blog/${p.slug}`,
    lastModified: p.updatedAt ?? undefined,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${siteUrl}/blog/category/${c.slug}`,
    lastModified: c.updatedAt ?? undefined,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  const tagRoutes: MetadataRoute.Sitemap = tagSlugs.map((slug) => ({
    url: `${siteUrl}/blog/tag/${slug}`,
    changeFrequency: "weekly",
    priority: 0.3,
  }));

  return [...staticRoutes, ...postRoutes, ...categoryRoutes, ...tagRoutes];
}

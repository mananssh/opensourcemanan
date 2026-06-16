import { listPublicPosts } from "@/lib/blog/queries";
import { siteUrl } from "@/lib/site";

// Regenerate at most hourly so new posts appear without a redeploy (DA #2).
export const revalidate = 3600;

function esc(s: string): string {
  return s.replace(
    /[<>&'"]/g,
    (c) =>
      ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[
        c
      ] as string,
  );
}

export async function GET() {
  const posts = await listPublicPosts();
  const items = posts
    .map((p) => {
      const url = `${siteUrl}/blog/${p.slug}`;
      return [
        "<item>",
        `<title>${esc(p.title)}</title>`,
        `<link>${url}</link>`,
        `<guid isPermaLink="true">${url}</guid>`,
        p.publishedAt ? `<pubDate>${p.publishedAt.toUTCString()}</pubDate>` : "",
        p.excerpt ? `<description>${esc(p.excerpt)}</description>` : "",
        "</item>",
      ].join("");
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
<title>OSM Blog</title>
<link>${siteUrl}/blog</link>
<description>Long-form essays and deep dives on engineering, design, and the things I build.</description>
${items}
</channel></rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}

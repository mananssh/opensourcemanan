import type { FeedItem } from "@/lib/blog/queries";
import { siteUrl, siteAuthor } from "@/lib/site";

/** Escape XML text content — only the three characters that matter in text. */
export function escapeXml(s: string): string {
  return s.replace(
    /[<>&]/g,
    (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c] as string,
  );
}

/** Strip MDX/markdown to readable plain text (for descriptions). */
function mdxToText(src: string): string {
  return src
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/^\s{0,3}[#>*\-+]\s+/gm, "")
    .replace(/[*_~`|]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** A description: the excerpt, else a truncated plain-text body. Never empty. */
export function feedExcerpt(item: FeedItem, max = 320): string {
  const base = item.excerpt?.trim() || mdxToText(item.bodyMdx);
  if (base.length <= max) return base;
  return base.slice(0, max).replace(/\s+\S*$/, "") + "…";
}

function cdata(html: string): string {
  return `<![CDATA[${html.replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;
}

/** Render an RSS 2.0 feed (with atom self-link + content:encoded). */
export function renderRss(opts: {
  title: string;
  description: string;
  feedUrl: string;
  link: string;
  items: FeedItem[];
}): string {
  const lastBuild =
    opts.items.find((i) => i.publishedAt)?.publishedAt ?? null;

  const itemsXml = opts.items
    .map((p) => {
      const url = `${siteUrl}/blog/${p.slug}`;
      const desc = feedExcerpt(p);
      const html =
        `<p>${escapeXml(desc)}</p>` +
        `<p><a href="${url}">Read the full post →</a></p>`;
      return [
        "<item>",
        `<title>${escapeXml(p.title)}</title>`,
        `<link>${url}</link>`,
        `<guid isPermaLink="true">${url}</guid>`,
        p.publishedAt ? `<pubDate>${p.publishedAt.toUTCString()}</pubDate>` : "",
        p.category ? `<category>${escapeXml(p.category.name)}</category>` : "",
        `<dc:creator>${escapeXml(siteAuthor.name)}</dc:creator>`,
        `<description>${escapeXml(desc)}</description>`,
        `<content:encoded>${cdata(html)}</content:encoded>`,
        "</item>",
      ].join("");
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/">
<channel>
<title>${escapeXml(opts.title)}</title>
<link>${opts.link}</link>
<atom:link href="${opts.feedUrl}" rel="self" type="application/rss+xml"/>
<description>${escapeXml(opts.description)}</description>
<language>en</language>${
    lastBuild ? `\n<lastBuildDate>${lastBuild.toUTCString()}</lastBuildDate>` : ""
  }
${itemsXml}
</channel></rss>`;
}

/** Render a JSON Feed 1.1 document. */
export function renderJsonFeed(opts: {
  title: string;
  description: string;
  feedUrl: string;
  items: FeedItem[];
}) {
  return {
    version: "https://jsonfeed.org/version/1.1",
    title: opts.title,
    home_page_url: `${siteUrl}/blog`,
    feed_url: opts.feedUrl,
    description: opts.description,
    authors: [{ name: siteAuthor.name, url: siteAuthor.url }],
    language: "en",
    items: opts.items.map((p) => {
      const url = `${siteUrl}/blog/${p.slug}`;
      return {
        id: url,
        url,
        title: p.title,
        content_text: feedExcerpt(p),
        ...(p.publishedAt ? { date_published: p.publishedAt.toISOString() } : {}),
        date_modified: p.updatedAt.toISOString(),
        ...(p.category ? { tags: [p.category.name] } : {}),
      };
    }),
  };
}

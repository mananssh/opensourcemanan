import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrettyCode from "rehype-pretty-code";
import GithubSlugger from "github-slugger";
import type { ReactNode } from "react";

export interface TocItem {
  depth: number;
  text: string;
  id: string;
}

/** Pull h2/h3 headings out of the MDX source for a table of contents. Slugs
 *  match rehype-slug (both use github-slugger). Skips fenced code blocks. */
export function extractToc(source: string): TocItem[] {
  const slugger = new GithubSlugger();
  const toc: TocItem[] = [];
  let inFence = false;
  for (const line of source.split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = line.match(/^(#{2,3})\s+(.+?)\s*#*\s*$/);
    if (m) {
      const text = m[2].replace(/[*_`[\]]/g, "").trim();
      toc.push({ depth: m[1].length, text, id: slugger.slug(text) });
    }
  }
  return toc;
}

/** ~200 wpm reading estimate, min 1. */
export function readingMinutes(source: string): number {
  const words = source.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

const components = {
  Callout: ({ children }: { children: ReactNode }) => (
    <aside className="my-6 border-l-2 border-accent bg-accent-soft/50 px-4 py-3 font-body text-ink">
      {children}
    </aside>
  ),
};

const rehypePrettyCodeOptions = {
  theme: { light: "github-light", dark: "github-dark-dimmed" },
  keepBackground: false,
};

/** Render trusted (owner-authored) MDX from the DB. */
export function PostBody({ source }: { source: string }) {
  return (
    <div className="blog-prose">
      <MDXRemote
        source={source}
        components={components}
        options={{
          mdxOptions: {
            remarkPlugins: [remarkGfm],
            rehypePlugins: [
              rehypeSlug,
              [rehypeAutolinkHeadings, { behavior: "wrap" }],
              [rehypePrettyCode, rehypePrettyCodeOptions],
            ],
          },
        }}
      />
    </div>
  );
}

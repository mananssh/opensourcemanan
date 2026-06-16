import { compile, run } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import { unstable_cache } from "next/cache";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrettyCode from "rehype-pretty-code";
import GithubSlugger from "github-slugger";
import type { ComponentType, ReactNode } from "react";

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

const components: Record<string, ComponentType<{ children?: ReactNode }>> = {
  Callout: ({ children }) => (
    <aside className="my-6 border-l-2 border-accent bg-accent-soft/50 px-4 py-3 font-body text-ink">
      {children}
    </aside>
  ),
};

const rehypePrettyCodeOptions = {
  theme: { light: "github-light", dark: "github-dark-dimmed" },
  keepBackground: false,
};

/**
 * Compile MDX → runnable function body. This is the expensive step (it runs
 * Shiki for code highlighting), so it's cached in the Next data cache keyed by
 * the source string: the same post compiles once and is reused across requests
 * (and serverless invocations). The route stays dynamic for visibility gating;
 * only this pure compile is cached. (Resolves DA #3 without route-level static
 * rendering — see ADR 0011.)
 */
const compileMdx = unstable_cache(
  async (source: string): Promise<string> => {
    const compiled = await compile(source, {
      outputFormat: "function-body",
      development: false,
      remarkPlugins: [remarkGfm],
      rehypePlugins: [
        rehypeSlug,
        [rehypeAutolinkHeadings, { behavior: "wrap" }],
        [rehypePrettyCode, rehypePrettyCodeOptions],
      ],
    });
    return String(compiled);
  },
  ["blog-mdx-compile"],
  { tags: ["blog-mdx"] },
);

type MdxContent = ComponentType<{
  components?: Record<string, ComponentType<{ children?: ReactNode }>>;
}>;

/** Render trusted (owner-authored) MDX from the DB. Compile is cached; render
 *  (run) is cheap and happens per request. */
export async function PostBody({ source }: { source: string }) {
  const code = await compileMdx(source);
  const mod = (await run(code, {
    ...runtime,
    baseUrl: import.meta.url,
  })) as { default: MdxContent };
  const Content = mod.default;
  return (
    <div className="blog-prose">
      <Content components={components} />
    </div>
  );
}

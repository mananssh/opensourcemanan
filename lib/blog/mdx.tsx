import { compile, run } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import { unstable_cache } from "next/cache";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrettyCode from "rehype-pretty-code";
import type { ComponentType, ReactNode } from "react";

export interface TocItem {
  depth: number;
  text: string;
  id: string;
}

// Minimal hast shape for the heading collector (avoids a unist-util dependency).
interface HastNode {
  type: string;
  tagName?: string;
  value?: string;
  properties?: { id?: unknown };
  children?: HastNode[];
}

function headingText(node: HastNode): string {
  let s = "";
  const walk = (n: HastNode) => {
    if (n.type === "text" && typeof n.value === "string") s += n.value;
    n.children?.forEach(walk);
  };
  walk(node);
  return s.trim();
}

/**
 * Rehype plugin that collects h2/h3 headings into `out`, reading the id that
 * rehype-slug assigned to the *rendered* heading — so the TOC anchors always
 * match the real heading ids (no parallel regex slugger that can drift).
 */
function rehypeCollectToc(out: TocItem[]) {
  return () => (tree: unknown) => {
    const visit = (node: HastNode) => {
      if (
        node.type === "element" &&
        (node.tagName === "h2" || node.tagName === "h3")
      ) {
        const id = node.properties?.id;
        if (typeof id === "string") {
          out.push({
            depth: node.tagName === "h2" ? 2 : 3,
            text: headingText(node),
            id,
          });
        }
      }
      node.children?.forEach(visit);
    };
    visit(tree as HastNode);
  };
}

type MdxComponentMap = Record<string, ComponentType<Record<string, unknown>>>;

const components: MdxComponentMap = {
  Callout: (props) => (
    <aside className="my-6 border-l-2 border-accent bg-accent-soft/50 px-4 py-3 font-body text-ink">
      {props.children as ReactNode}
    </aside>
  ),
  // Markdown images → lazy <figure> with an optional caption from the title.
  img: (props) => {
    const src = typeof props.src === "string" ? props.src : "";
    const alt = typeof props.alt === "string" ? props.alt : "";
    const title = typeof props.title === "string" ? props.title : undefined;
    return (
      <figure className="blog-figure">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} loading="lazy" decoding="async" />
        {title && <figcaption>{title}</figcaption>}
      </figure>
    );
  },
};

const rehypePrettyCodeOptions = {
  theme: { light: "github-light", dark: "github-dark-dimmed" },
  keepBackground: false,
};

const autolinkOptions = {
  behavior: "append" as const,
  properties: {
    className: ["heading-anchor"],
    ariaLabel: "Link to this section",
    tabIndex: -1,
  },
  content: {
    type: "element" as const,
    tagName: "span",
    properties: { ariaHidden: "true" },
    children: [{ type: "text" as const, value: "#" }],
  },
};

/**
 * Compile MDX → { runnable code, TOC }. The expensive step (Shiki highlighting)
 * is cached in the Next data cache keyed by the source string, so a post
 * compiles once and is reused across requests. The route stays dynamic for
 * visibility gating; only this pure compile is cached (ADR 0011/0012).
 *
 * The TOC is collected during the same rehype pass as slug assignment, so its
 * anchor ids can never diverge from the rendered heading ids.
 */
export const compilePost = unstable_cache(
  async (source: string): Promise<{ code: string; toc: TocItem[] }> => {
    const toc: TocItem[] = [];
    const compiled = await compile(source, {
      outputFormat: "function-body",
      development: false,
      remarkPlugins: [remarkGfm],
      rehypePlugins: [
        rehypeSlug,
        rehypeCollectToc(toc),
        [rehypeAutolinkHeadings, autolinkOptions],
        [rehypePrettyCode, rehypePrettyCodeOptions],
      ],
    });
    return { code: String(compiled), toc };
  },
  ["blog-mdx-compile-v2"],
  { tags: ["blog-mdx"] },
);

type MdxContent = ComponentType<{ components?: MdxComponentMap }>;

/** Render precompiled MDX (run() is cheap and happens per request). */
export async function PostBody({ code }: { code: string }) {
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

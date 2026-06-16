import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  getPublicPost,
  getPostAccess,
  listPublicPosts,
  type PostWithCategory,
} from "@/lib/blog/queries";
import { PostBody, extractToc, readingMinutes } from "@/lib/blog/mdx";

type Params = Promise<{ slug: string }>;

// Public posts are prerendered (below) and revalidated hourly; gated posts fall
// through to the dynamic session check (DA #3).
export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  const posts = await listPublicPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

function fmtDate(d: Date | null): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  let post: PostWithCategory | null = await getPublicPost(slug);
  if (!post) {
    const access = await getPostAccess(slug);
    post = access.status === "ok" ? access.post : null;
  }
  if (!post) return { title: "Not found" };
  const description = post.metaDescription ?? post.excerpt ?? undefined;
  return {
    title: post.metaTitle ?? post.title,
    description,
    openGraph: {
      title: post.title,
      description,
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
    },
  };
}

export default async function PostPage({ params }: { params: Params }) {
  const { slug } = await params;

  // Fast path: public post → no session read → statically rendered / ISR.
  let post: PostWithCategory | null = await getPublicPost(slug);
  if (!post) {
    // Gated or missing → session-aware (dynamic).
    const access = await getPostAccess(slug);
    if (access.status === "signin") redirect(`/sign-in?next=/blog/${slug}`);
    if (access.status === "notfound") notFound();
    post = access.post;
  }

  const toc = extractToc(post.bodyMdx);
  const mins = readingMinutes(post.bodyMdx);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt ?? undefined,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt?.toISOString(),
  };

  return (
    <article className="mx-auto w-full max-w-5xl px-6 pb-28 pt-16">
      <header className="reveal border-b border-rule pb-10">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-faint">
          {post.category && (
            <Link
              href={`/blog/category/${post.category.slug}`}
              className="text-accent transition-colors hover:underline"
            >
              {post.category.name}
            </Link>
          )}
          {post.publishedAt && <span>{fmtDate(post.publishedAt)}</span>}
          <span>{mins} min read</span>
          {post.status !== "published" && (
            <span className="rounded-sm bg-accent px-1.5 text-paper">draft</span>
          )}
        </div>
        <h1 className="mt-5 max-w-3xl font-display text-5xl font-extrabold leading-[0.98] tracking-[-0.02em] text-ink sm:text-6xl">
          {post.title}
        </h1>
        {post.excerpt && (
          <p className="mt-5 max-w-2xl font-body text-xl leading-relaxed text-muted">
            {post.excerpt}
          </p>
        )}
      </header>

      <div className="mt-12 lg:grid lg:grid-cols-[1fr_15rem] lg:gap-14">
        <div className="min-w-0 max-w-2xl">
          <PostBody source={post.bodyMdx} />
        </div>

        {toc.length > 0 && (
          <aside className="mt-12 lg:mt-0">
            <nav className="lg:sticky lg:top-24">
              <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-faint">
                On this page
              </p>
              <ul className="mt-3 space-y-2">
                {toc.map((h) => (
                  <li key={h.id} className={h.depth === 3 ? "pl-4" : ""}>
                    <a
                      href={`#${h.id}`}
                      className="font-mono text-xs text-muted transition-colors hover:text-accent"
                    >
                      {h.text}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
        )}
      </div>

      <div className="mt-20 border-t border-rule pt-6">
        <Link
          href="/blog"
          className="font-mono text-xs uppercase tracking-[0.2em] text-muted transition-colors hover:text-accent"
        >
          ← all posts
        </Link>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </article>
  );
}

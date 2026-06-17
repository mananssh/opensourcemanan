import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  getPostAccess,
  getPostTags,
  getRelatedPosts,
  getPostNeighbors,
} from "@/lib/blog/queries";
import {
  getReactionState,
  listComments,
  getViewCount,
  getBookmarkState,
} from "@/lib/blog/engagement";
import { auth } from "@/lib/auth";
import { PostBody, compilePost } from "@/lib/blog/mdx";
import { PostList } from "@/components/blog/post-list";
import { ReactionBar } from "@/components/blog/reaction-bar";
import { BookmarkButton } from "@/components/blog/bookmark-button";
import { SharePost } from "@/components/blog/share-post";
import { CommentSection } from "@/components/blog/comment-section";
import { ViewBeacon } from "@/components/blog/view-beacon";
import { PostReadingUx } from "@/components/blog/post-reading-ux";
import { TableOfContents } from "@/components/blog/table-of-contents";
import { siteUrl, siteName, siteAuthor } from "@/lib/site";

type Params = Promise<{ slug: string }>;

// Dynamic: the route reads the session to enforce visibility, so it can't be
// statically generated (see ADR 0011 — the route-level static split conflicted
// with cookie reads on gated posts; per-request MDX caching is the follow-up).

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
  const access = await getPostAccess(slug);
  if (access.status !== "ok") return { title: "Not found" };
  const post = access.post;
  const description = post.metaDescription ?? post.excerpt ?? undefined;
  const canonical = `/blog/${slug}`;
  const isPublished = post.status === "published";
  return {
    title: post.metaTitle ?? post.title,
    description,
    alternates: { canonical },
    // Drafts are owner-only previews — never let a crawler index them.
    robots: isPublished ? undefined : { index: false, follow: false },
    openGraph: {
      title: post.title,
      description,
      type: "article",
      url: canonical,
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt?.toISOString(),
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
    },
  };
}

export default async function PostPage({ params }: { params: Params }) {
  const { slug } = await params;
  const access = await getPostAccess(slug);
  if (access.status === "signin") redirect(`/sign-in?next=/blog/${slug}`);
  if (access.status === "notfound") notFound();
  const post = access.post;

  const { code, toc } = await compilePost(post.bodyMdx);
  const mins = post.readingMinutes;
  const postTags = await getPostTags(post.id);
  const [related, neighbors, session, reaction, comments, views, bookmark] =
    await Promise.all([
      getRelatedPosts({
        id: post.id,
        categoryId: post.categoryId,
        tagIds: postTags.map((t) => t.id),
      }),
      getPostNeighbors(post.slug),
      auth(),
      getReactionState(post.id),
      listComments(post.id),
      getViewCount(post.id),
      getBookmarkState(post.id),
    ]);

  const canonical = `${siteUrl}/blog/${post.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        headline: post.title,
        description: post.metaDescription ?? post.excerpt ?? undefined,
        datePublished: post.publishedAt?.toISOString(),
        dateModified: post.updatedAt?.toISOString(),
        mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
        url: canonical,
        image: [`${canonical}/opengraph-image`],
        author: { "@type": "Person", name: siteAuthor.name, url: siteAuthor.url },
        publisher: { "@type": "Person", name: siteAuthor.name, url: siteAuthor.url },
        ...(post.category
          ? { articleSection: post.category.name }
          : {}),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: siteName, item: siteUrl },
          { "@type": "ListItem", position: 2, name: "Blog", item: `${siteUrl}/blog` },
          ...(post.category
            ? [
                {
                  "@type": "ListItem",
                  position: 3,
                  name: post.category.name,
                  item: `${siteUrl}/blog/category/${post.category.slug}`,
                },
              ]
            : []),
          {
            "@type": "ListItem",
            position: post.category ? 4 : 3,
            name: post.title,
            item: canonical,
          },
        ],
      },
    ],
  };

  return (
    <article className="mx-auto w-full max-w-5xl px-6 pb-28 pt-16">
      <PostReadingUx />
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
          <span>{views} view{views === 1 ? "" : "s"}</span>
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
        {postTags.length > 0 && (
          <ul className="mt-6 flex flex-wrap gap-2">
            {postTags.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/blog/tag/${t.slug}`}
                  className="inline-flex rounded-full border border-rule px-3 py-1 font-mono text-[0.7rem] uppercase tracking-[0.12em] text-muted transition-colors hover:border-accent hover:text-accent"
                >
                  #{t.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </header>

      {/* Mobile TOC: collapsible, above the article (the sticky aside is
          desktop-only and would otherwise sit uselessly below the post). */}
      {toc.length > 0 && (
        <details className="mt-8 rounded-lg border border-rule p-4 lg:hidden">
          <summary className="cursor-pointer font-mono text-[0.7rem] uppercase tracking-[0.2em] text-faint">
            On this page
          </summary>
          <div className="mt-3">
            <TableOfContents items={toc} />
          </div>
        </details>
      )}

      <div className="mt-12 lg:grid lg:grid-cols-[1fr_15rem] lg:gap-14">
        <div className="min-w-0 max-w-2xl">
          <PostBody code={code} />
        </div>

        {toc.length > 0 && (
          <aside className="hidden lg:block">
            <TableOfContents
              items={toc}
              label="On this page"
              className="lg:sticky lg:top-24"
            />
          </aside>
        )}
      </div>

      <div className="mt-12 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <ReactionBar
            postId={post.id}
            slug={post.slug}
            count={reaction.count}
            reacted={reaction.reacted}
          />
          <BookmarkButton
            postId={post.id}
            slug={post.slug}
            bookmarked={bookmark.bookmarked}
          />
        </div>
        <SharePost url={`${siteUrl}/blog/${post.slug}`} title={post.title} />
      </div>

      <CommentSection
        postId={post.id}
        slug={post.slug}
        comments={comments}
        session={session}
      />

      <ViewBeacon postId={post.id} />

      {(neighbors.newer || neighbors.older) && (
        <nav
          aria-label="More posts"
          className="mt-16 grid gap-4 border-t border-rule pt-8 sm:grid-cols-2"
        >
          {neighbors.newer ? (
            <Link
              href={`/blog/${neighbors.newer.slug}`}
              className="group rounded-lg border border-rule p-4 transition-colors hover:border-accent"
            >
              <span className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-faint">
                ← Newer
              </span>
              <span className="mt-1 block font-display font-semibold text-ink transition-colors group-hover:text-accent">
                {neighbors.newer.title}
              </span>
            </Link>
          ) : (
            <span />
          )}
          {neighbors.older && (
            <Link
              href={`/blog/${neighbors.older.slug}`}
              className="group rounded-lg border border-rule p-4 text-right transition-colors hover:border-accent"
            >
              <span className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-faint">
                Older →
              </span>
              <span className="mt-1 block font-display font-semibold text-ink transition-colors group-hover:text-accent">
                {neighbors.older.title}
              </span>
            </Link>
          )}
        </nav>
      )}

      {related.length > 0 && (
        <section className="mt-20 border-t border-rule pt-10">
          <p className="mb-2 font-mono text-xs uppercase tracking-[0.25em] text-faint">
            Related
          </p>
          <PostList posts={related} />
        </section>
      )}

      <div className="mt-16 border-t border-rule pt-6">
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

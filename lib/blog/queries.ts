import { cache } from "react";
import type { Session } from "next-auth";
import { eq, desc, and, or, ne, ilike, inArray, isNull, lte } from "drizzle-orm";
import { db } from "@/db/client";
import {
  posts,
  categories,
  tags,
  postTags,
  bookmarks,
  type Post,
  type Category,
  type Tag,
} from "@/db/schema";
import { auth } from "@/lib/auth";
import {
  canSee,
  canSeePost,
  isEffectivelyPublic,
  effectiveVisibility,
  type Gate,
} from "@/lib/content/visibility";
import { safeDb } from "@/lib/blog/safe-db";

/**
 * The blog store — every read filters by the CURRENT session server-side, so
 * gated rows never reach the client. Reads are deduped per request via
 * React cache(). Only EXPECTED pre-setup errors (missing table before the first
 * migration, or no DATABASE_URL) degrade to an empty state; real query failures
 * throw so they surface instead of silently showing "no posts" (DA #5).
 */

/** Card shape for listings — deliberately excludes the heavy `bodyMdx` (DA #1). */
export interface PostCard {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImageKey: string | null;
  publishedAt: Date | null;
  readingMinutes: number;
  category: { name: string; slug: string } | null;
}

export type PostWithCategory = Post & { category: Category | null };

const safe = safeDb;

/**
 * The SQL predicate for a post that is actually live: published, not
 * soft-deleted, and past its (possibly scheduled) publish time. Used by every
 * public/visitor query so scheduled + deleted posts never appear.
 */
function livePost() {
  return and(
    eq(posts.status, "published"),
    isNull(posts.deletedAt),
    lte(posts.publishedAt, new Date()),
  );
}

// Columns needed for listings + the visibility filter (no bodyMdx).
const cardColumns = {
  id: posts.id,
  slug: posts.slug,
  title: posts.title,
  excerpt: posts.excerpt,
  coverImageKey: posts.coverImageKey,
  publishedAt: posts.publishedAt,
  readingMinutes: posts.readingMinutes,
  postVisibility: posts.visibility,
  postAllowedEmails: posts.allowedEmails,
  categoryName: categories.name,
  categorySlug: categories.slug,
  categoryVisibility: categories.visibility,
  categoryAllowedEmails: categories.allowedEmails,
};

type CardRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImageKey: string | null;
  publishedAt: Date | null;
  readingMinutes: number;
  postVisibility: Gate["visibility"];
  postAllowedEmails: string[];
  categoryName: string | null;
  categorySlug: string | null;
  categoryVisibility: Gate["visibility"] | null;
  categoryAllowedEmails: string[] | null;
};

function rowGates(r: CardRow): { post: Gate; category: Gate | null } {
  return {
    post: { visibility: r.postVisibility, allowedEmails: r.postAllowedEmails },
    category: r.categorySlug
      ? {
          visibility: r.categoryVisibility ?? "public",
          allowedEmails: r.categoryAllowedEmails ?? [],
        }
      : null,
  };
}

function toCard(r: CardRow): PostCard {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    excerpt: r.excerpt,
    coverImageKey: r.coverImageKey,
    publishedAt: r.publishedAt,
    readingMinutes: r.readingMinutes,
    category: r.categorySlug ? { name: r.categoryName ?? "", slug: r.categorySlug } : null,
  };
}

/** Published posts the current viewer may see, newest first (listing cards). */
export const listVisiblePosts = cache(
  async (opts?: { categorySlug?: string }): Promise<PostCard[]> => {
    const session = await auth();
    return safe(async () => {
      const rows = (await db
        .select(cardColumns)
        .from(posts)
        .leftJoin(categories, eq(posts.categoryId, categories.id))
        .where(livePost())
        .orderBy(desc(posts.publishedAt), desc(posts.createdAt))) as CardRow[];
      return rows
        .filter((r) => (opts?.categorySlug ? r.categorySlug === opts.categorySlug : true))
        .filter((r) => {
          const { post, category } = rowGates(r);
          return canSeePost(session, post, category);
        })
        .map(toCard);
    }, []);
  },
);

/** Featured posts the viewer may see (for the index hero strip). */
export const listFeaturedPosts = cache(async (): Promise<PostCard[]> => {
  const session = await auth();
  return safe(async () => {
    const rows = (await db
      .select(cardColumns)
      .from(posts)
      .leftJoin(categories, eq(posts.categoryId, categories.id))
      .where(and(livePost(), eq(posts.featured, true)))
      .orderBy(desc(posts.publishedAt))) as CardRow[];
    return rows
      .filter((r) => {
        const { post, category } = rowGates(r);
        return canSeePost(session, post, category);
      })
      .map(toCard);
  }, []);
});

/** Categories the current viewer may see, in display order. */
export const listVisibleCategories = cache(async (): Promise<Category[]> => {
  const session = await auth();
  return safe(async () => {
    const rows = await db
      .select()
      .from(categories)
      .orderBy(categories.sortOrder, categories.name);
    return rows.filter((c) => canSee(session, c));
  }, []);
});

export const getVisibleCategory = cache(
  async (slug: string): Promise<Category | null> => {
    const session = await auth();
    return safe(async () => {
      const rows = await db
        .select()
        .from(categories)
        .where(eq(categories.slug, slug))
        .limit(1);
      if (rows.length === 0) return null;
      return canSee(session, rows[0]) ? rows[0] : null;
    }, null);
  },
);

/**
 * Resolve access to a single post for the detail page (DA #4). Distinguishes
 * "sign in would unlock this" (effective gate is just `authed` and the viewer is
 * anonymous) from a true 404 — without leaking the existence of owner/allowlist
 * content. Deduped + carries the full post (with bodyMdx) for rendering.
 */
export type PostAccess =
  | { status: "ok"; post: PostWithCategory }
  | { status: "signin" }
  | { status: "notfound" };

export const getPostAccess = cache(async (slug: string): Promise<PostAccess> => {
  const session = await auth();
  return safe<PostAccess>(async () => {
    const rows = await db
      .select()
      .from(posts)
      .leftJoin(categories, eq(posts.categoryId, categories.id))
      .where(eq(posts.slug, slug))
      .limit(1);
    if (rows.length === 0) return { status: "notfound" };
    const post: PostWithCategory = { ...rows[0].posts, category: rows[0].categories };

    // Not live = draft, soft-deleted, or scheduled for the future. The owner can
    // preview it; everyone else gets a 404.
    const isLive =
      post.status === "published" &&
      !post.deletedAt &&
      !!post.publishedAt &&
      post.publishedAt.getTime() <= Date.now();
    if (!isLive) {
      return session?.user?.isOwner ? { status: "ok", post } : { status: "notfound" };
    }
    if (canSeePost(session, post, post.category)) return { status: "ok", post };

    const eff = effectiveVisibility(
      post.visibility,
      post.category?.visibility ?? "public",
    );
    if (eff === "authed" && !session?.user) return { status: "signin" };
    return { status: "notfound" };
  }, { status: "notfound" });
});

/** Posts the current viewer has bookmarked (and may still see), newest-saved first. */
export const listBookmarkedPosts = cache(async (): Promise<PostCard[]> => {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase() ?? null;
  if (!email) return [];
  return safe(async () => {
    const rows = (await db
      .select(cardColumns)
      .from(bookmarks)
      .innerJoin(posts, eq(posts.id, bookmarks.postId))
      .leftJoin(categories, eq(posts.categoryId, categories.id))
      .where(and(eq(bookmarks.userEmail, email), livePost()))
      .orderBy(desc(bookmarks.createdAt))) as CardRow[];
    return rows
      .filter((r) => {
        const { post, category } = rowGates(r);
        return canSeePost(session, post, category);
      })
      .map(toCard);
  }, []);
});

/** Newer/older neighbors of a post among the viewer's visible posts. */
export const getPostNeighbors = cache(
  async (slug: string): Promise<{ newer: PostCard | null; older: PostCard | null }> => {
    const all = await listVisiblePosts();
    const i = all.findIndex((p) => p.slug === slug);
    if (i === -1) return { newer: null, older: null };
    return {
      newer: i > 0 ? all[i - 1] : null,
      older: i < all.length - 1 ? all[i + 1] : null,
    };
  },
);

function visibleFilter(session: Session | null) {
  return (r: CardRow) => {
    const { post, category } = rowGates(r);
    return canSeePost(session, post, category);
  };
}

/** Tags attached to a post (for display). */
export const getPostTags = cache(async (postId: string): Promise<Tag[]> => {
  return safe(async () => {
    return db
      .select({
        id: tags.id,
        slug: tags.slug,
        name: tags.name,
        createdAt: tags.createdAt,
      })
      .from(postTags)
      .innerJoin(tags, eq(postTags.tagId, tags.id))
      .where(eq(postTags.postId, postId))
      .orderBy(tags.name);
  }, []);
});

export const getTag = cache(async (slug: string): Promise<Tag | null> => {
  return safe(async () => {
    const rows = await db.select().from(tags).where(eq(tags.slug, slug)).limit(1);
    return rows[0] ?? null;
  }, null);
});

/** Visible published posts carrying a tag. */
export const listPostsByTag = cache(
  async (slug: string): Promise<PostCard[]> => {
    const session = await auth();
    return safe(async () => {
      const rows = (await db
        .select(cardColumns)
        .from(posts)
        .innerJoin(postTags, eq(postTags.postId, posts.id))
        .innerJoin(tags, eq(tags.id, postTags.tagId))
        .leftJoin(categories, eq(posts.categoryId, categories.id))
        .where(and(livePost(), eq(tags.slug, slug)))
        .orderBy(desc(posts.publishedAt))) as CardRow[];
      return rows.filter(visibleFilter(session)).map(toCard);
    }, []);
  },
);

/** Full-text-ish search over title/excerpt/body of visible published posts. */
export const searchVisiblePosts = cache(
  async (query: string): Promise<PostCard[]> => {
    const term = query.trim();
    if (!term) return [];
    const session = await auth();
    return safe(async () => {
      // Escape LIKE wildcards so a user's % or _ is matched literally.
      const escaped = term.replace(/[\\%_]/g, (c) => `\\${c}`);
      const like = `%${escaped}%`;
      const rows = (await db
        .select(cardColumns)
        .from(posts)
        .leftJoin(categories, eq(posts.categoryId, categories.id))
        .where(
          and(
            livePost(),
            or(
              ilike(posts.title, like),
              ilike(posts.excerpt, like),
              ilike(posts.bodyMdx, like),
            ),
          ),
        )
        .orderBy(desc(posts.publishedAt))) as CardRow[];
      return rows.filter(visibleFilter(session)).map(toCard);
    }, []);
  },
);

/** Related posts: same category or a shared tag, excluding the post itself. */
export const getRelatedPosts = cache(
  async (input: {
    id: string;
    categoryId: string | null;
    tagIds: string[];
  }): Promise<PostCard[]> => {
    const session = await auth();
    return safe(async () => {
      const conds = [];
      if (input.categoryId) conds.push(eq(posts.categoryId, input.categoryId));
      if (input.tagIds.length > 0) {
        conds.push(
          inArray(
            posts.id,
            db
              .select({ pid: postTags.postId })
              .from(postTags)
              .where(inArray(postTags.tagId, input.tagIds)),
          ),
        );
      }
      if (conds.length === 0) return [];
      const rows = (await db
        .select(cardColumns)
        .from(posts)
        .leftJoin(categories, eq(posts.categoryId, categories.id))
        .where(and(livePost(), ne(posts.id, input.id), or(...conds)))
        .orderBy(desc(posts.publishedAt))
        .limit(8)) as CardRow[];
      return rows.filter(visibleFilter(session)).map(toCard).slice(0, 3);
    }, []);
  },
);

/** Title + category for an effectively-public post — session-less, for OG images. */
export const getPublicPostMeta = cache(
  async (slug: string): Promise<{ title: string; categoryName: string | null } | null> => {
    return safe(async () => {
      const rows = await db
        .select({
          title: posts.title,
          status: posts.status,
          postVisibility: posts.visibility,
          categoryName: categories.name,
          categoryVisibility: categories.visibility,
        })
        .from(posts)
        .leftJoin(categories, eq(posts.categoryId, categories.id))
        .where(eq(posts.slug, slug))
        .limit(1);
      if (rows.length === 0) return null;
      const r = rows[0];
      if (r.status !== "published") return null;
      if (r.postVisibility !== "public") return null;
      if (r.categoryName && r.categoryVisibility !== "public") return null;
      return { title: r.title, categoryName: r.categoryName };
    }, null);
  },
);

/**
 * True if `postId` is a real, published post — the gate for counting a view.
 * Session-less by design (the beacon is anonymous); blocks draft posts and
 * arbitrary/unknown UUIDs from inflating counts.
 */
export async function isPublishedPostId(postId: string): Promise<boolean> {
  return safe(async () => {
    const rows = await db
      .select({ id: posts.id })
      .from(posts)
      .where(and(eq(posts.id, postId), livePost()))
      .limit(1);
    return rows.length > 0;
  }, false);
}

/** Published + effectively-public posts only — for sitemap/RSS (no session). */
export const listPublicPosts = cache(async (): Promise<
  (PostCard & { updatedAt: Date })[]
> => {
  return safe(async () => {
    const rows = (await db
      .select({ ...cardColumns, updatedAt: posts.updatedAt })
      .from(posts)
      .leftJoin(categories, eq(posts.categoryId, categories.id))
      .where(livePost())
      .orderBy(desc(posts.publishedAt))) as (CardRow & { updatedAt: Date })[];
    return rows
      .filter((r) => {
        const { post, category } = rowGates(r);
        return isEffectivelyPublic(post, category);
      })
      .map((r) => ({ ...toCard(r), updatedAt: r.updatedAt }));
  }, []);
});

export interface FeedItem {
  slug: string;
  title: string;
  excerpt: string | null;
  bodyMdx: string;
  publishedAt: Date | null;
  updatedAt: Date;
  category: { name: string; slug: string } | null;
}

/**
 * Effectively-public published posts WITH body — for RSS/JSON feeds (no
 * session). Optionally scoped to a category for per-category feeds.
 */
export const listPublicPostsForFeed = cache(
  async (opts?: { categorySlug?: string }): Promise<FeedItem[]> => {
    return safe(async () => {
      const rows = (await db
        .select({ ...cardColumns, bodyMdx: posts.bodyMdx, updatedAt: posts.updatedAt })
        .from(posts)
        .leftJoin(categories, eq(posts.categoryId, categories.id))
        .where(livePost())
        .orderBy(desc(posts.publishedAt))) as (CardRow & {
        bodyMdx: string;
        updatedAt: Date;
      })[];
      return rows
        .filter((r) => (opts?.categorySlug ? r.categorySlug === opts.categorySlug : true))
        .filter((r) => {
          const { post, category } = rowGates(r);
          return isEffectivelyPublic(post, category);
        })
        .map((r) => ({
          slug: r.slug,
          title: r.title,
          excerpt: r.excerpt,
          bodyMdx: r.bodyMdx,
          publishedAt: r.publishedAt,
          updatedAt: r.updatedAt,
          category: r.categorySlug
            ? { name: r.categoryName ?? "", slug: r.categorySlug }
            : null,
        }));
    }, []);
  },
);

/** Public categories (visibility = public) — for the sitemap (no session). */
export const listPublicCategories = cache(async (): Promise<
  { slug: string; updatedAt: Date }[]
> => {
  return safe(async () => {
    const rows = await db
      .select({ slug: categories.slug, updatedAt: categories.updatedAt })
      .from(categories)
      .where(eq(categories.visibility, "public"));
    return rows;
  }, []);
});

/** Distinct tag slugs that appear on effectively-public posts — for the sitemap. */
export const listPublicTagSlugs = cache(async (): Promise<string[]> => {
  return safe(async () => {
    const rows = (await db
      .selectDistinct({
        tagSlug: tags.slug,
        postVisibility: posts.visibility,
        postAllowedEmails: posts.allowedEmails,
        categorySlug: categories.slug,
        categoryVisibility: categories.visibility,
        categoryAllowedEmails: categories.allowedEmails,
      })
      .from(tags)
      .innerJoin(postTags, eq(postTags.tagId, tags.id))
      .innerJoin(posts, eq(posts.id, postTags.postId))
      .leftJoin(categories, eq(posts.categoryId, categories.id))
      .where(livePost())) as {
      tagSlug: string;
      postVisibility: Gate["visibility"];
      postAllowedEmails: string[];
      categorySlug: string | null;
      categoryVisibility: Gate["visibility"] | null;
      categoryAllowedEmails: string[] | null;
    }[];
    const slugs = new Set<string>();
    for (const r of rows) {
      const post: Gate = {
        visibility: r.postVisibility,
        allowedEmails: r.postAllowedEmails,
      };
      const category: Gate | null = r.categorySlug
        ? {
            visibility: r.categoryVisibility ?? "public",
            allowedEmails: r.categoryAllowedEmails ?? [],
          }
        : null;
      if (isEffectivelyPublic(post, category)) slugs.add(r.tagSlug);
    }
    return [...slugs];
  }, []);
});

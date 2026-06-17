import { cache } from "react";
import type { Session } from "next-auth";
import { eq, desc, and, or, ne, ilike, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import {
  posts,
  categories,
  tags,
  postTags,
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
  publishedAt: Date | null;
  readingMinutes: number;
  category: { name: string; slug: string } | null;
}

export type PostWithCategory = Post & { category: Category | null };

const safe = safeDb;

// Columns needed for listings + the visibility filter (no bodyMdx).
const cardColumns = {
  id: posts.id,
  slug: posts.slug,
  title: posts.title,
  excerpt: posts.excerpt,
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
        .where(eq(posts.status, "published"))
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

    if (post.status !== "published") {
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
        .where(and(eq(posts.status, "published"), eq(tags.slug, slug)))
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
      const like = `%${term}%`;
      const rows = (await db
        .select(cardColumns)
        .from(posts)
        .leftJoin(categories, eq(posts.categoryId, categories.id))
        .where(
          and(
            eq(posts.status, "published"),
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
        .where(
          and(eq(posts.status, "published"), ne(posts.id, input.id), or(...conds)),
        )
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

/** Published + effectively-public posts only — for sitemap/RSS (no session). */
export const listPublicPosts = cache(async (): Promise<
  (PostCard & { updatedAt: Date })[]
> => {
  return safe(async () => {
    const rows = (await db
      .select({ ...cardColumns, updatedAt: posts.updatedAt })
      .from(posts)
      .leftJoin(categories, eq(posts.categoryId, categories.id))
      .where(eq(posts.status, "published"))
      .orderBy(desc(posts.publishedAt))) as (CardRow & { updatedAt: Date })[];
    return rows
      .filter((r) => {
        const { post, category } = rowGates(r);
        return isEffectivelyPublic(post, category);
      })
      .map((r) => ({ ...toCard(r), updatedAt: r.updatedAt }));
  }, []);
});

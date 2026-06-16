import { cache } from "react";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db/client";
import { posts, categories, type Post, type Category } from "@/db/schema";
import { auth } from "@/lib/auth";
import {
  canSee,
  canSeePost,
  isEffectivelyPublic,
  effectiveVisibility,
  type Gate,
} from "@/lib/content/visibility";

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

function isExpectedEmptyDbError(error: unknown): boolean {
  // Walk the cause chain — drizzle wraps the underlying Postgres error, so the
  // 42P01 code / message can be nested rather than top-level.
  let e: unknown = error;
  for (let i = 0; i < 5 && e; i++) {
    const o = e as { code?: unknown; message?: unknown; cause?: unknown };
    if (o.code === "42P01") return true; // undefined_table (pre-migration)
    if (
      typeof o.message === "string" &&
      (o.message.includes("DATABASE_URL is not set") ||
        o.message.includes("does not exist"))
    ) {
      return true;
    }
    e = o.cause;
  }
  return false;
}

async function safe<T>(fn: () => Promise<T>, emptyFallback: T): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (isExpectedEmptyDbError(error)) {
      console.warn("[blog] DB not ready, returning empty:", error);
      return emptyFallback;
    }
    throw error; // real failure — let it surface
  }
}

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

import { eq, desc } from "drizzle-orm";
import { db } from "@/db/client";
import { posts, categories, type Post, type Category } from "@/db/schema";
import { auth } from "@/lib/auth";
import {
  canSee,
  canSeePost,
  isEffectivelyPublic,
} from "@/lib/content/visibility";

/**
 * The blog store — every read filters by the CURRENT session server-side, so
 * gated rows never reach the client. All queries degrade to empty/null if the
 * DB isn't reachable yet (e.g. before the first migration runs), so pages render
 * a graceful empty state instead of crashing.
 */
export type PostWithCategory = Post & { category: Category | null };

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error("[blog] query failed:", error);
    return fallback;
  }
}

function join(row: { posts: Post; categories: Category | null }): PostWithCategory {
  return { ...row.posts, category: row.categories };
}

/** Published posts the current viewer may see, newest first. */
export async function listVisiblePosts(opts?: {
  categorySlug?: string;
}): Promise<PostWithCategory[]> {
  const session = await auth();
  return safe(async () => {
    const rows = await db
      .select()
      .from(posts)
      .leftJoin(categories, eq(posts.categoryId, categories.id))
      .where(eq(posts.status, "published"))
      .orderBy(desc(posts.publishedAt));
    return rows
      .map(join)
      .filter((p) => (opts?.categorySlug ? p.category?.slug === opts.categorySlug : true))
      .filter((p) => canSeePost(session, p, p.category));
  }, []);
}

/** A single post by slug, if the viewer may see it. Drafts: owner only. */
export async function getVisiblePost(
  slug: string,
): Promise<PostWithCategory | null> {
  const session = await auth();
  return safe(async () => {
    const rows = await db
      .select()
      .from(posts)
      .leftJoin(categories, eq(posts.categoryId, categories.id))
      .where(eq(posts.slug, slug))
      .limit(1);
    if (rows.length === 0) return null;
    const post = join(rows[0]);
    if (post.status !== "published") {
      return session?.user?.isOwner ? post : null;
    }
    return canSeePost(session, post, post.category) ? post : null;
  }, null);
}

/** Categories the current viewer may see, in display order. */
export async function listVisibleCategories(): Promise<Category[]> {
  const session = await auth();
  return safe(async () => {
    const rows = await db
      .select()
      .from(categories)
      .orderBy(categories.sortOrder, categories.name);
    return rows.filter((c) => canSee(session, c));
  }, []);
}

export async function getVisibleCategory(
  slug: string,
): Promise<Category | null> {
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
}

/** Published + effectively-public posts only — for sitemap/RSS (no session). */
export async function listPublicPosts(): Promise<PostWithCategory[]> {
  return safe(async () => {
    const rows = await db
      .select()
      .from(posts)
      .leftJoin(categories, eq(posts.categoryId, categories.id))
      .where(eq(posts.status, "published"))
      .orderBy(desc(posts.publishedAt));
    return rows.map(join).filter((p) => isEffectivelyPublic(p, p.category));
  }, []);
}

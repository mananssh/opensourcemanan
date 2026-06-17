import { desc, eq, isNull, count as sqlCount } from "drizzle-orm";
import { db } from "@/db/client";
import {
  posts,
  categories,
  tags,
  postTags,
  comments,
  subscribers,
  type Post,
  type Category,
} from "@/db/schema";
import { requireOwner } from "@/lib/auth";

/**
 * Owner-facing reads for the admin CMS — NO visibility filtering and includes
 * drafts + commenter PII. Every function calls `requireOwner()` itself so the
 * guard is co-located with the data access, not solely on the admin layout: if
 * one of these is ever imported into a non-admin route, it still can't leak.
 * (`requireOwner` resolves `auth()`, which is request-cached, so it's cheap.)
 */

export interface AdminPostRow {
  id: string;
  slug: string;
  title: string;
  status: "draft" | "published";
  visibility: "public" | "authed" | "allowlist" | "owner";
  publishedAt: Date | null;
  updatedAt: Date;
  categoryName: string | null;
}

export async function adminListPosts(): Promise<AdminPostRow[]> {
  await requireOwner();
  const rows = await db
    .select({
      id: posts.id,
      slug: posts.slug,
      title: posts.title,
      status: posts.status,
      visibility: posts.visibility,
      publishedAt: posts.publishedAt,
      updatedAt: posts.updatedAt,
      categoryName: categories.name,
    })
    .from(posts)
    .leftJoin(categories, eq(posts.categoryId, categories.id))
    .where(isNull(posts.deletedAt))
    .orderBy(desc(posts.updatedAt));
  return rows as AdminPostRow[];
}

export async function adminGetPost(id: string): Promise<Post | undefined> {
  await requireOwner();
  const rows = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  return rows[0];
}

/** Comma-joined tag names for a post, for prefilling the editor. */
export async function adminGetPostTagNames(postId: string): Promise<string> {
  await requireOwner();
  const rows = await db
    .select({ name: tags.name })
    .from(postTags)
    .innerJoin(tags, eq(postTags.tagId, tags.id))
    .where(eq(postTags.postId, postId))
    .orderBy(tags.name);
  return rows.map((r) => r.name).join(", ");
}

export async function adminListCategories(): Promise<Category[]> {
  await requireOwner();
  return db
    .select()
    .from(categories)
    .orderBy(categories.sortOrder, categories.name);
}

export async function adminGetCategory(id: string): Promise<Category | undefined> {
  await requireOwner();
  const rows = await db
    .select()
    .from(categories)
    .where(eq(categories.id, id))
    .limit(1);
  return rows[0];
}

export interface AdminCommentRow {
  id: string;
  body: string;
  userName: string;
  userEmail: string;
  status: "visible" | "hidden";
  createdAt: Date;
  postTitle: string | null;
  postSlug: string | null;
}

export async function adminCountSubscribers(): Promise<number> {
  await requireOwner();
  const [row] = await db.select({ c: sqlCount() }).from(subscribers);
  return Number(row?.c ?? 0);
}

export async function adminRecentComments(): Promise<AdminCommentRow[]> {
  await requireOwner();
  const rows = await db
    .select({
      id: comments.id,
      body: comments.body,
      userName: comments.userName,
      userEmail: comments.userEmail,
      status: comments.status,
      createdAt: comments.createdAt,
      postTitle: posts.title,
      postSlug: posts.slug,
    })
    .from(comments)
    .leftJoin(posts, eq(comments.postId, posts.id))
    .orderBy(desc(comments.createdAt))
    .limit(50);
  return rows as AdminCommentRow[];
}

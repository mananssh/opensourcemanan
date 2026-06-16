import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import {
  posts,
  categories,
  tags,
  postTags,
  comments,
  type Post,
  type Category,
} from "@/db/schema";

/**
 * Owner-facing reads for the admin CMS — NO visibility filtering and includes
 * drafts. Only ever called under the owner-gated /blog/admin layout; the write
 * actions re-check `requireOwner` independently (server actions are directly
 * invokable).
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
    .orderBy(desc(posts.updatedAt));
  return rows as AdminPostRow[];
}

export async function adminGetPost(id: string): Promise<Post | undefined> {
  const rows = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  return rows[0];
}

/** Comma-joined tag names for a post, for prefilling the editor. */
export async function adminGetPostTagNames(postId: string): Promise<string> {
  const rows = await db
    .select({ name: tags.name })
    .from(postTags)
    .innerJoin(tags, eq(postTags.tagId, tags.id))
    .where(eq(postTags.postId, postId))
    .orderBy(tags.name);
  return rows.map((r) => r.name).join(", ");
}

export async function adminListCategories(): Promise<Category[]> {
  return db
    .select()
    .from(categories)
    .orderBy(categories.sortOrder, categories.name);
}

export async function adminGetCategory(id: string): Promise<Category | undefined> {
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
  createdAt: Date;
  postTitle: string | null;
  postSlug: string | null;
}

export async function adminRecentComments(): Promise<AdminCommentRow[]> {
  const rows = await db
    .select({
      id: comments.id,
      body: comments.body,
      userName: comments.userName,
      userEmail: comments.userEmail,
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

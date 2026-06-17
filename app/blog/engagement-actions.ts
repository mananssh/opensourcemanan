"use server";

import { revalidatePath } from "next/cache";
import { eq, and, gte, count as sqlCount } from "drizzle-orm";
import { db } from "@/db/client";
import { reactions, comments, subscribers, bookmarks } from "@/db/schema";
import { requireAuth, requireOwner } from "@/lib/auth";

export type CommentState = { error?: string; ok?: boolean };

/** Toggle the current user's reaction on a post. Requires sign-in. */
export async function toggleReaction(formData: FormData): Promise<void> {
  const session = await requireAuth();
  const email = session.user?.email?.toLowerCase();
  const postId = String(formData.get("postId") ?? "");
  const slug = String(formData.get("slug") ?? "");
  if (!email || !postId) return;

  const existing = await db
    .select({ e: reactions.userEmail })
    .from(reactions)
    .where(and(eq(reactions.postId, postId), eq(reactions.userEmail, email)))
    .limit(1);

  if (existing.length > 0) {
    await db
      .delete(reactions)
      .where(and(eq(reactions.postId, postId), eq(reactions.userEmail, email)));
  } else {
    await db
      .insert(reactions)
      .values({ postId, userEmail: email })
      .onConflictDoNothing();
  }
  if (slug) revalidatePath(`/blog/${slug}`);
}

/** Delete a comment — allowed for its author or the owner. */
export async function deleteOwnComment(formData: FormData): Promise<void> {
  const session = await requireAuth();
  const email = session.user?.email?.toLowerCase();
  const isOwner = session.user?.isOwner ?? false;
  const id = String(formData.get("commentId") ?? "");
  const slug = String(formData.get("slug") ?? "");
  if (!id || !email) return;

  const [row] = await db
    .select({ email: comments.userEmail })
    .from(comments)
    .where(eq(comments.id, id))
    .limit(1);
  if (row && (isOwner || row.email.toLowerCase() === email)) {
    await db.delete(comments).where(eq(comments.id, id));
  }
  if (slug) revalidatePath(`/blog/${slug}`);
}

/** Newsletter signup (public). useActionState-shaped: (prevState, formData). */
export async function subscribe(
  _prev: { ok: boolean; message: string },
  formData: FormData,
): Promise<{ ok: boolean; message: string }> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { ok: false, message: "Enter a valid email." };
  }
  try {
    await db.insert(subscribers).values({ email }).onConflictDoNothing();
  } catch {
    return { ok: false, message: "Something went wrong — try again." };
  }
  return { ok: true, message: "Subscribed. Thanks!" };
}

/** Add a comment (plaintext) to a post. Requires sign-in. Rate-limited. */
export async function addComment(
  _prev: CommentState,
  formData: FormData,
): Promise<CommentState> {
  const session = await requireAuth();
  const email = session.user?.email?.toLowerCase();
  const postId = String(formData.get("postId") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const parentId = String(formData.get("parentId") ?? "") || null;
  const body = String(formData.get("body") ?? "").trim().slice(0, 4000);

  if (!email || !postId) return { error: "Could not post your comment." };
  if (!body) return { error: "Write something first." };

  // Rate limit: at most 5 comments per user per minute (anti-flood).
  const since = new Date(Date.now() - 60_000);
  const [rl] = await db
    .select({ c: sqlCount() })
    .from(comments)
    .where(and(eq(comments.userEmail, email), gte(comments.createdAt, since)));
  if (Number(rl?.c ?? 0) >= 5) {
    return { error: "You're commenting too fast — give it a moment." };
  }

  await db.insert(comments).values({
    postId,
    parentId,
    userEmail: email,
    userName: session.user?.name ?? email,
    body,
  });
  if (slug) revalidatePath(`/blog/${slug}`);
  return { ok: true };
}

/** Toggle the current user's bookmark on a post. Requires sign-in. */
export async function toggleBookmark(formData: FormData): Promise<void> {
  const session = await requireAuth();
  const email = session.user?.email?.toLowerCase();
  const postId = String(formData.get("postId") ?? "");
  const slug = String(formData.get("slug") ?? "");
  if (!email || !postId) return;

  const existing = await db
    .select({ p: bookmarks.postId })
    .from(bookmarks)
    .where(and(eq(bookmarks.postId, postId), eq(bookmarks.userEmail, email)))
    .limit(1);
  if (existing.length > 0) {
    await db
      .delete(bookmarks)
      .where(and(eq(bookmarks.postId, postId), eq(bookmarks.userEmail, email)));
  } else {
    await db
      .insert(bookmarks)
      .values({ postId, userEmail: email })
      .onConflictDoNothing();
  }
  if (slug) revalidatePath(`/blog/${slug}`);
  revalidatePath("/blog/bookmarks");
}

/** Owner moderation: hide/show a comment. */
export async function toggleCommentVisibility(formData: FormData): Promise<void> {
  await requireOwner();
  const id = String(formData.get("commentId") ?? "");
  const slug = String(formData.get("slug") ?? "");
  if (!id) return;
  const [row] = await db
    .select({ status: comments.status })
    .from(comments)
    .where(eq(comments.id, id))
    .limit(1);
  if (row) {
    await db
      .update(comments)
      .set({ status: row.status === "visible" ? "hidden" : "visible" })
      .where(eq(comments.id, id));
  }
  revalidatePath("/blog/admin", "layout");
  if (slug) revalidatePath(`/blog/${slug}`);
}

"use server";

import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { db } from "@/db/client";
import { reactions, comments } from "@/db/schema";
import { requireAuth } from "@/lib/auth";

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

/** Add a comment (plaintext) to a post. Requires sign-in. */
export async function addComment(formData: FormData): Promise<void> {
  const session = await requireAuth();
  const email = session.user?.email?.toLowerCase();
  const postId = String(formData.get("postId") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const body = String(formData.get("body") ?? "").trim().slice(0, 4000);

  if (email && postId && body) {
    await db.insert(comments).values({
      postId,
      userEmail: email,
      userName: session.user?.name ?? email,
      body,
    });
  }
  if (slug) revalidatePath(`/blog/${slug}`);
}

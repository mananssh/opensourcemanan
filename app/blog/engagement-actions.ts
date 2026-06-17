"use server";

import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { db } from "@/db/client";
import { reactions, comments, subscribers } from "@/db/schema";
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

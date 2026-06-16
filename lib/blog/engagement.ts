import { cache } from "react";
import { eq, and, asc, count as sqlCount } from "drizzle-orm";
import { db } from "@/db/client";
import { reactions, comments, postViews, type Comment } from "@/db/schema";
import { auth } from "@/lib/auth";
import { safeDb } from "@/lib/blog/safe-db";

/** Reaction count for a post + whether the current viewer has reacted. */
export const getReactionState = cache(
  async (postId: string): Promise<{ count: number; reacted: boolean }> => {
    const session = await auth();
    const email = session?.user?.email?.toLowerCase() ?? null;
    return safeDb(
      async () => {
        const [row] = await db
          .select({ c: sqlCount() })
          .from(reactions)
          .where(eq(reactions.postId, postId));
        let reacted = false;
        if (email) {
          const mine = await db
            .select({ e: reactions.userEmail })
            .from(reactions)
            .where(and(eq(reactions.postId, postId), eq(reactions.userEmail, email)))
            .limit(1);
          reacted = mine.length > 0;
        }
        return { count: Number(row?.c ?? 0), reacted };
      },
      { count: 0, reacted: false },
    );
  },
);

/** Comments on a post, oldest first. */
export const listComments = cache(async (postId: string): Promise<Comment[]> => {
  return safeDb(
    async () =>
      db
        .select()
        .from(comments)
        .where(eq(comments.postId, postId))
        .orderBy(asc(comments.createdAt)),
    [],
  );
});

/** Current view count for a post. */
export const getViewCount = cache(async (postId: string): Promise<number> => {
  return safeDb(async () => {
    const [row] = await db
      .select({ count: postViews.count })
      .from(postViews)
      .where(eq(postViews.postId, postId))
      .limit(1);
    return row?.count ?? 0;
  }, 0);
});

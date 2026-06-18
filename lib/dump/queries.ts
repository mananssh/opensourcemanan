import { cache } from "react";
import { eq, and, desc, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { thoughts, type Thought } from "@/db/schema";
import { auth } from "@/lib/auth";
import { canSee } from "@/lib/content/visibility";
import { thoughtGate } from "@/lib/dump/visibility";
import { getReadUrl } from "@/lib/storage/gcs";
import { safeDb } from "@/lib/blog/safe-db";

/**
 * Thought Dump store — every read filters by the current session server-side
 * (gated thoughts never reach the client), deduped per request via cache(), and
 * resilient to the pre-migration window via safeDb.
 */

export type ThoughtCard = Thought & { imageUrl: string | null };

/** Resolve a private image key to a short-lived signed URL (owner/authed only). */
async function withImageUrl(t: Thought): Promise<ThoughtCard> {
  const imageUrl = t.imageKey ? await getReadUrl(t.imageKey) : null;
  return { ...t, imageUrl };
}

/** Thoughts the current viewer may see — pinned first, then newest. */
export const listVisibleThoughts = cache(async (): Promise<ThoughtCard[]> => {
  const session = await auth();
  return safeDb(async () => {
    const rows = await db
      .select()
      .from(thoughts)
      .where(isNull(thoughts.deletedAt))
      .orderBy(desc(thoughts.pinned), desc(thoughts.createdAt));
    const visible = rows.filter((t) =>
      canSee(session, thoughtGate(t.visibility)),
    );
    return Promise.all(visible.map(withImageUrl));
  }, []);
});

export type ThoughtAccess =
  | { status: "ok"; thought: ThoughtCard }
  | { status: "signin" }
  | { status: "notfound" };

/**
 * Resolve access to a single thought for its permalink. Distinguishes "sign in
 * to view this public thought" from a true 404 (private thought → no existence
 * leak), mirroring the blog's getPostAccess.
 */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const getThoughtAccess = cache(
  async (id: string): Promise<ThoughtAccess> => {
    if (!UUID_RE.test(id)) return { status: "notfound" };
    const session = await auth();
    return safeDb<ThoughtAccess>(async () => {
      const rows = await db
        .select()
        .from(thoughts)
        .where(and(eq(thoughts.id, id), isNull(thoughts.deletedAt)))
        .limit(1);
      if (rows.length === 0) return { status: "notfound" };
      const t = rows[0];
      if (canSee(session, thoughtGate(t.visibility))) {
        return { status: "ok", thought: await withImageUrl(t) };
      }
      // Public thought + anonymous viewer → signing in unlocks it.
      if (t.visibility === "public" && !session?.user) {
        return { status: "signin" };
      }
      return { status: "notfound" };
    }, { status: "notfound" });
  },
);

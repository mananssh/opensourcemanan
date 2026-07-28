import { cache } from "react";
import { eq, and, desc, ne, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { follows, watchers, watchEntries } from "@/db/schema";
import { safeDb } from "@/lib/blog/safe-db";
import { toCard, toPublicWatcher, type MovieCard, type PublicWatcher } from "@/lib/movies/queries";

/**
 * Follow-graph reads. Reel is NOT a feed — the only way a friend's activity
 * reaches you is by following their exact @handle. These power the dashboard
 * "friends strip" and the profile follow button/counts. All cache()-deduped and
 * safeDb-guarded for the pre-migration window.
 */

/** Does `followerId` follow `followeeId`? */
export const isFollowing = cache(
  async (followerId: string, followeeId: string): Promise<boolean> => {
    if (followerId === followeeId) return false;
    return safeDb(async () => {
      const rows = await db
        .select({ f: follows.followerId })
        .from(follows)
        .where(
          and(
            eq(follows.followerId, followerId),
            eq(follows.followeeId, followeeId),
          ),
        )
        .limit(1);
      return rows.length > 0;
    }, false);
  },
);

/** Follower / following counts for a watcher. */
export const getFollowCounts = cache(
  async (watcherId: string): Promise<{ followers: number; following: number }> => {
    return safeDb(async () => {
      const [followers, following] = await Promise.all([
        db.select({ id: follows.followerId }).from(follows).where(eq(follows.followeeId, watcherId)),
        db.select({ id: follows.followeeId }).from(follows).where(eq(follows.followerId, watcherId)),
      ]);
      return { followers: followers.length, following: following.length };
    }, { followers: 0, following: 0 });
  },
);

/** Watchers the viewer follows (for the friends rail), newest-followed first. */
export const listFollowing = cache(
  async (viewerId: string): Promise<PublicWatcher[]> => {
    return safeDb(async () => {
      const rows = await db
        .select({ w: watchers })
        .from(follows)
        .innerJoin(watchers, eq(watchers.id, follows.followeeId))
        .where(eq(follows.followerId, viewerId))
        .orderBy(desc(follows.createdAt));
      return rows.map((r) => toPublicWatcher(r.w));
    }, []);
  },
);

export interface FriendWatch {
  entry: MovieCard;
  watcher: PublicWatcher;
}

/**
 * Recent watches from everyone the viewer follows — reverse-chronological, NO
 * ranking (deliberately not an algorithm). Watchlist items are excluded (a
 * private queue). This is the "friends strip" on the dashboard.
 */
export const getFriendsFeed = cache(
  async (viewerId: string, limit = 18): Promise<FriendWatch[]> => {
    return safeDb(async () => {
      const followeeRows = await db
        .select({ id: follows.followeeId })
        .from(follows)
        .where(eq(follows.followerId, viewerId));
      const ids = followeeRows.map((r) => r.id);
      if (ids.length === 0) return [];

      const rows = await db
        .select({ e: watchEntries, w: watchers })
        .from(watchEntries)
        .innerJoin(watchers, eq(watchers.id, watchEntries.viewerId))
        .where(
          and(
            inArray(watchEntries.viewerId, ids),
            ne(watchEntries.status, "watchlist"),
          ),
        )
        .orderBy(desc(watchEntries.createdAt))
        .limit(limit);

      return rows.map((r) => ({
        entry: toCard(r.e),
        watcher: toPublicWatcher(r.w),
      }));
    }, []);
  },
);

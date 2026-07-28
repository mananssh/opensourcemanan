import { cache } from "react";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db/client";
import { watchers, type Watcher } from "@/db/schema";
import { auth, requireAuth } from "@/lib/auth";
import { safeDb } from "@/lib/blog/safe-db";
import { HANDLE_RE, normalizeHandle } from "@/lib/movies/handle";

/**
 * The Reel identity layer — the repo's first multi-user primitive. NextAuth's
 * JWT session has no user record, so a `watchers` row (provisioned on first
 * sign-in) is the durable identity that watch entries and follows key off. This
 * is the movies analog of lib/auth's requireOwner, but per-user rather than a
 * single owner allowlist. Pure @handle helpers live in lib/movies/handle.ts
 * (client-safe); this module is server-only (imports the DB client).
 */

/** The current viewer's watcher row, or null if signed out / not yet onboarded. */
export const getViewer = cache(async (): Promise<Watcher | null> => {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  if (!email) return null;
  return safeDb<Watcher | null>(async () => {
    const rows = await db
      .select()
      .from(watchers)
      .where(eq(watchers.email, email))
      .limit(1);
    return rows[0] ?? null;
  }, null);
});

/** A watcher by public @handle (for profile pages). */
export const getWatcherByHandle = cache(
  async (handle: string): Promise<Watcher | null> => {
    const h = normalizeHandle(handle);
    if (!HANDLE_RE.test(h)) return null;
    return safeDb<Watcher | null>(async () => {
      const rows = await db
        .select()
        .from(watchers)
        .where(eq(watchers.handle, h))
        .limit(1);
      return rows[0] ?? null;
    }, null);
  },
);

/**
 * Guard for authoring: require a signed-in, onboarded viewer. Redirects anon
 * users to /sign-in (via requireAuth) and signed-in-but-handleless users to the
 * onboarding step. Returns the watcher row.
 */
export async function requireViewer(): Promise<Watcher> {
  await requireAuth();
  const viewer = await getViewer();
  if (!viewer) redirect("/movies/welcome");
  return viewer;
}

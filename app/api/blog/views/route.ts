import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import { postViews } from "@/db/schema";
import { isPublishedPostId } from "@/lib/blog/queries";

/**
 * Increment a post's view counter (fire-and-forget from the client beacon).
 *
 * Hardening over a naive counter:
 *  - only a well-formed UUID that maps to a *published* post is counted, so
 *    arbitrary/unknown IDs and drafts can't inflate the number;
 *  - a per-browser cookie de-dupes repeat views for a day (stronger than the
 *    client's sessionStorage guard, which resets per tab and is bypassable).
 * Cross-browser / cookie-less abuse still isn't fully prevented without a shared
 * rate-limit store — acceptable for a personal blog's vanity counter.
 */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const COOKIE = "osm_vv";
const DAY_SECONDS = 60 * 60 * 24;

export async function POST(request: Request) {
  let postId = "";
  try {
    const body = (await request.json()) as { postId?: string };
    postId = typeof body.postId === "string" ? body.postId : "";
  } catch {
    return NextResponse.json({ error: "bad body" }, { status: 400 });
  }
  if (!UUID_RE.test(postId)) {
    return NextResponse.json({ error: "invalid postId" }, { status: 400 });
  }

  // Cookie carries "YYYY-MM-DD|id,id,…" — reset daily, capped to avoid bloat.
  const today = new Date().toISOString().slice(0, 10);
  const raw = request.headers
    .get("cookie")
    ?.split("; ")
    .find((c) => c.startsWith(`${COOKIE}=`))
    ?.slice(COOKIE.length + 1);
  let seen: string[] = [];
  if (raw) {
    const [day, ids] = decodeURIComponent(raw).split("|");
    if (day === today && ids) seen = ids.split(",");
  }
  if (seen.includes(postId)) {
    return NextResponse.json({ ok: true, deduped: true });
  }

  if (!(await isPublishedPostId(postId))) {
    return NextResponse.json({ error: "unknown post" }, { status: 404 });
  }

  await db
    .insert(postViews)
    .values({ postId, count: 1 })
    .onConflictDoUpdate({
      target: postViews.postId,
      set: { count: sql`${postViews.count} + 1` },
    });

  const next = [...seen, postId].slice(-100);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, `${today}|${next.join(",")}`, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: DAY_SECONDS,
  });
  return res;
}

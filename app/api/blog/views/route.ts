import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import { postViews } from "@/db/schema";

/** Increment a post's view counter (fire-and-forget from the client beacon). */
export async function POST(request: Request) {
  let postId = "";
  try {
    const body = (await request.json()) as { postId?: string };
    postId = typeof body.postId === "string" ? body.postId : "";
  } catch {
    return NextResponse.json({ error: "bad body" }, { status: 400 });
  }
  if (!postId) return NextResponse.json({ error: "postId required" }, { status: 400 });

  await db
    .insert(postViews)
    .values({ postId, count: 1 })
    .onConflictDoUpdate({
      target: postViews.postId,
      set: { count: sql`${postViews.count} + 1` },
    });
  return NextResponse.json({ ok: true });
}

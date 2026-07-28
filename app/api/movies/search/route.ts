import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { searchTitles } from "@/lib/movies/tmdb";

// Live TMDB proxy — signed-in only (keeps anonymous traffic off the free tier),
// results cached in movie_cache by the client so repeat queries are cheap.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  // Surface whether TMDB is wired up so the client can nudge the owner to add
  // TMDB_API_KEY instead of silently showing "no matches".
  const configured = Boolean(process.env.TMDB_API_KEY);
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return Response.json({ results: [], configured });
  const results = await searchTitles(q, req.signal);
  return Response.json({ results, configured });
}

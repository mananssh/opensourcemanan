import { NextResponse } from "next/server";
import { searchSongs } from "@/lib/games/geetdle/queries";

/**
 * Autocomplete for the guess box. Searches the catalog by title substring and
 * returns only lightweight fields — never which song is today's answer.
 */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  if (q.trim().length < 2) {
    return NextResponse.json({ results: [] });
  }
  try {
    const results = await searchSongs(q, 8);
    return NextResponse.json({ results });
  } catch (err) {
    console.error("[geetdle/search]", err);
    return NextResponse.json({ error: "search failed" }, { status: 500 });
  }
}

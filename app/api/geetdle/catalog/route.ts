import { NextResponse } from "next/server";
import { getClientCatalog } from "@/lib/games/geetdle/queries";

/**
 * The lean guess catalog for the client: every searchable song's guessable
 * fields (no audio/poster hints, no answer flag). Fetched once on game load for
 * instant local autocomplete and the "possibilities" filter. Safe to cache hard
 * — it only changes on a reseed — so we let the CDN serve it with a long
 * stale-while-revalidate window. The daily answer is still picked and scored
 * server-side (app/api/geetdle/guess), so shipping the catalog reveals nothing.
 */
export async function GET() {
  try {
    const songs = await getClientCatalog();
    return NextResponse.json(
      { songs },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=86400, stale-while-revalidate=604800",
        },
      },
    );
  } catch (err) {
    console.error("[geetdle/catalog]", err);
    return NextResponse.json({ error: "catalog failed" }, { status: 500 });
  }
}

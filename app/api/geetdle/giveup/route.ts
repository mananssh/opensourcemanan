import { NextResponse } from "next/server";
import { getPuzzleNumber } from "@/lib/games/geetdle/rules";
import { getDailySong, youtubeThumb } from "@/lib/games/geetdle/queries";

/**
 * Give up on a puzzle: reveal the answer and both hints, server-side. Same
 * reveal the game grants on a loss — the client flips to its "lost" state. The
 * answer is still only ever computed here (seeded by the server-only salt); the
 * client never holds the daily pick until it asks for it.
 */
export async function POST(request: Request) {
  let puzzle: number | undefined;
  try {
    const body = (await request.json()) as { puzzle?: number };
    puzzle = Number.isFinite(Number(body.puzzle)) ? Number(body.puzzle) : undefined;
  } catch {
    return NextResponse.json({ error: "bad body" }, { status: 400 });
  }
  // Clamp to [0, today] — you can give up on the past, not the future.
  const today = getPuzzleNumber();
  const puzzleNumber =
    puzzle === undefined ? today : Math.max(0, Math.min(Math.floor(puzzle), today));

  try {
    const answerRow = await getDailySong(puzzleNumber);
    if (!answerRow) {
      return NextResponse.json({ error: "no puzzle today" }, { status: 503 });
    }
    return NextResponse.json({
      puzzleNumber,
      audioUrl: answerRow.audioUrl,
      posterUrl: answerRow.posterUrl ?? youtubeThumb(answerRow.youtubeUrl),
      answer: {
        title: answerRow.title,
        movie: answerRow.movie,
        year: answerRow.year,
      },
    });
  } catch (err) {
    console.error("[geetdle/giveup]", err);
    return NextResponse.json({ error: "give up failed" }, { status: 500 });
  }
}

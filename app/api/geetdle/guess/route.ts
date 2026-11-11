import { NextResponse } from "next/server";
import { checkGuess, isWinningGuess, getPuzzleNumber } from "@/lib/games/geetdle/rules";
import {
  getDailySong,
  getSongById,
  toBollywoodSong,
  youtubeThumb,
} from "@/lib/games/geetdle/queries";

/**
 * Evaluate a guess server-side. The daily answer never leaves the server:
 * the client sends the guessed song's catalog id, we score it against today's
 * answer and return per-category feedback. The poster hint is revealed only
 * after 3 guesses (or on a win), and the answer's details only on a win.
 */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const POSTER_UNLOCK_AT = 3;

export async function POST(request: Request) {
  let id = "";
  let guessNumber = 0;
  try {
    const body = (await request.json()) as { id?: string; guessNumber?: number };
    id = typeof body.id === "string" ? body.id : "";
    guessNumber = Number(body.guessNumber) || 0;
  } catch {
    return NextResponse.json({ error: "bad body" }, { status: 400 });
  }
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  try {
    const [guessRow, answerRow] = await Promise.all([
      getSongById(id),
      getDailySong(),
    ]);
    if (!guessRow) {
      return NextResponse.json({ error: "unknown song" }, { status: 404 });
    }
    if (!answerRow) {
      return NextResponse.json({ error: "no puzzle today" }, { status: 503 });
    }

    const feedback = checkGuess(
      toBollywoodSong(guessRow),
      toBollywoodSong(answerRow),
    );
    const won = isWinningGuess(feedback);
    const revealPoster = won || guessNumber >= POSTER_UNLOCK_AT;

    return NextResponse.json({
      guessTitle: guessRow.title,
      feedback,
      won,
      puzzleNumber: getPuzzleNumber(),
      posterUrl: revealPoster ? youtubeThumb(answerRow.youtubeUrl) : null,
      answer: won
        ? { title: answerRow.title, movie: answerRow.movie, year: answerRow.year }
        : null,
    });
  } catch (err) {
    console.error("[geetdle/guess]", err);
    return NextResponse.json({ error: "guess failed" }, { status: 500 });
  }
}

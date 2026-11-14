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
// Hint ladder, by number of incorrect guesses made: audio preview after 3,
// song poster after 7, and the answer is revealed after the 8th (final) miss.
const AUDIO_UNLOCK_AT = 3;
const POSTER_UNLOCK_AT = 7;
const MAX_GUESSES = 8;

export async function POST(request: Request) {
  let id = "";
  let guessNumber = 0;
  let puzzle: number | undefined;
  try {
    const body = (await request.json()) as {
      id?: string;
      guessNumber?: number;
      puzzle?: number;
    };
    id = typeof body.id === "string" ? body.id : "";
    guessNumber = Number(body.guessNumber) || 0;
    puzzle = Number.isFinite(Number(body.puzzle)) ? Number(body.puzzle) : undefined;
  } catch {
    return NextResponse.json({ error: "bad body" }, { status: 400 });
  }
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }
  // Clamp the requested puzzle to [0, today] — you can replay the past, not the future.
  const today = getPuzzleNumber();
  const puzzleNumber =
    puzzle === undefined ? today : Math.max(0, Math.min(Math.floor(puzzle), today));

  try {
    const [guessRow, answerRow] = await Promise.all([
      getSongById(id),
      getDailySong(puzzleNumber),
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
    // Out of guesses: the 8th (final) miss ends the game and reveals the answer.
    const lost = !won && guessNumber >= MAX_GUESSES;
    const revealAudio = won || guessNumber >= AUDIO_UNLOCK_AT;
    const revealPoster = won || lost || guessNumber >= POSTER_UNLOCK_AT;

    return NextResponse.json({
      guessTitle: guessRow.title,
      feedback,
      won,
      lost,
      puzzleNumber,
      maxGuesses: MAX_GUESSES,
      audioUrl: revealAudio ? answerRow.audioUrl : null,
      posterUrl: revealPoster
        ? answerRow.posterUrl ?? youtubeThumb(answerRow.youtubeUrl)
        : null,
      answer:
        won || lost
          ? { title: answerRow.title, movie: answerRow.movie, year: answerRow.year }
          : null,
    });
  } catch (err) {
    console.error("[geetdle/guess]", err);
    return NextResponse.json({ error: "guess failed" }, { status: 500 });
  }
}

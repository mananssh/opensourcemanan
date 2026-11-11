"use client";

import { useState, useMemo } from "react";
import type { Guess, GeetdlePhase, CategoryFeedback } from "@/lib/games/geetdle/types";
import { generateShareText, getPuzzleNumber } from "@/lib/games/geetdle/rules";
import { GameBoard } from "./game-board";
import { GuessInput } from "./guess-input";
import { ShareModal } from "./share-modal";

type GuessResponse = {
  guessTitle: string;
  feedback: CategoryFeedback[];
  won: boolean;
  puzzleNumber: number;
  posterUrl: string | null;
  answer: { title: string; movie: string; year: number } | null;
};

const POSTER_UNLOCK_THRESHOLD = 3;
const SHARE_URL = "https://mananssh.com/games/geetdle";

export function GeetdleApp() {
  const [phase, setPhase] = useState<GeetdlePhase>("hub");
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [isWon, setIsWon] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [answer, setAnswer] = useState<GuessResponse["answer"]>(null);
  const [submitting, setSubmitting] = useState(false);

  const puzzleNumber = useMemo(() => getPuzzleNumber(), []);

  const handleStartGame = () => setPhase("playing");
  const handleShare = () => setShowShare(true);

  const handleGuess = async (song: { id: string; title: string }) => {
    if (submitting || isWon) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/geetdle/guess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: song.id, guessNumber: guesses.length + 1 }),
      });
      if (!res.ok) throw new Error(`guess failed: ${res.status}`);
      const data = (await res.json()) as GuessResponse;

      setGuesses((prev) => [
        ...prev,
        { song_title: data.guessTitle, feedback: data.feedback, timestamp: Date.now() },
      ]);
      // Poster, once revealed by the server, stays revealed.
      if (data.posterUrl) setPosterUrl(data.posterUrl);
      if (data.won) {
        setIsWon(true);
        setAnswer(data.answer);
        setPhase("won");
        setTimeout(() => setShowShare(true), 1000);
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong submitting your guess. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (phase === "hub") {
    return (
      <div className="container mx-auto px-5 py-16 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p
            className="mb-4 text-[11px] tracking-[0.2em] text-faint sm:mb-5 sm:text-xs"
            style={{ fontFamily: "var(--mono-family)" }}
          >
            DAILY PUZZLE #{puzzleNumber}
          </p>

          <h1
            className="geetdle-wordmark mb-5 text-6xl text-ink sm:mb-6 sm:text-7xl md:text-9xl"
            style={{ fontFamily: "var(--display-family)" }}
          >
            GEETDLE
          </h1>

          <p className="mx-auto mb-10 max-w-md text-balance text-base text-muted sm:text-lg">
            Guess the Bollywood song from category clues. A new puzzle every day.
          </p>

          <button
            onClick={handleStartGame}
            className="rounded-full bg-accent px-9 py-4 text-base font-semibold text-accent-ink transition-all hover:opacity-90 active:scale-[0.98]"
          >
            Play today&apos;s puzzle
          </button>

          <div className="mx-auto mt-20 max-w-lg border-t border-rule pt-10 text-left">
            <h2
              className="mb-6 text-center text-xs uppercase tracking-[0.2em] text-faint"
              style={{ fontFamily: "var(--mono-family)" }}
            >
              How to play
            </h2>
            <div className="space-y-4 text-sm text-muted">
              <p>
                Each guess scores six categories — Music Director, Singer(s),
                Year, Movie, Language and Genre.
              </p>
              <ul className="space-y-2.5">
                <li className="flex items-center gap-3">
                  <span
                    className="inline-block h-3.5 w-3.5 shrink-0 rounded-sm"
                    style={{ background: "var(--success)" }}
                  />
                  Exact match
                </li>
                <li className="flex items-center gap-3">
                  <span
                    className="inline-block h-3.5 w-3.5 shrink-0 rounded-sm"
                    style={{ background: "var(--partial)" }}
                  />
                  Close — within a year, or a shared singer
                </li>
                <li className="flex items-center gap-3">
                  <span
                    className="inline-block h-3.5 w-3.5 shrink-0 rounded-sm"
                    style={{ background: "var(--wrong)" }}
                  />
                  Wrong — arrows point toward the year
                </li>
              </ul>
              <p className="pt-1 text-faint">
                The movie poster unlocks after {POSTER_UNLOCK_THRESHOLD} guesses.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-5 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p
              className="text-xs tracking-[0.2em] text-faint"
              style={{ fontFamily: "var(--mono-family)" }}
            >
              PUZZLE #{puzzleNumber}
            </p>
            <p
              className="mt-2 text-sm text-muted"
              style={{ fontFamily: "var(--mono-family)" }}
            >
              {guesses.length} GUESS{guesses.length !== 1 ? "ES" : ""}
            </p>
          </div>

          {isWon && (
            <button
              onClick={handleShare}
              className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink transition-all hover:opacity-90 active:scale-[0.98]"
            >
              Share results
            </button>
          )}
        </div>

        <GameBoard guesses={guesses} posterUrl={posterUrl} isWon={isWon} />

        {!isWon && (
          <div className="mt-8">
            <GuessInput onGuess={handleGuess} disabled={submitting} />
          </div>
        )}

        {isWon && answer && (
          <div className="mt-10">
            <div className="rounded-2xl border border-rule bg-surface p-8 text-center">
              <p
                className="mb-3 text-xs uppercase tracking-[0.2em]"
                style={{ fontFamily: "var(--mono-family)", color: "var(--success)" }}
              >
                Solved in {guesses.length} guess{guesses.length !== 1 ? "es" : ""}
              </p>
              <p
                className="mb-1 text-2xl font-bold text-ink"
                style={{ fontFamily: "var(--display-family)" }}
              >
                {answer.title}
              </p>
              <p className="text-sm text-muted">
                {answer.movie} · {answer.year}
              </p>
            </div>
          </div>
        )}
      </div>

      {showShare && (
        <ShareModal
          displayText={generateShareText(guesses, puzzleNumber)}
          shareText={generateShareText(guesses, puzzleNumber, SHARE_URL)}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  );
}

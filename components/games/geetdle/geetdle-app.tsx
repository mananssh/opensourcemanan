"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import type { Guess, GeetdlePhase, CategoryFeedback } from "@/lib/games/geetdle/types";
import { generateShareText, getPuzzleNumber } from "@/lib/games/geetdle/rules";
import { GameBoard } from "./game-board";
import { GuessInput } from "./guess-input";
import { ShareModal } from "./share-modal";

type GuessResponse = {
  guessTitle: string;
  feedback: CategoryFeedback[];
  won: boolean;
  lost: boolean;
  puzzleNumber: number;
  maxGuesses: number;
  posterUrl: string | null;
  audioUrl: string | null;
  answer: { title: string; movie: string; year: number } | null;
};

const AUDIO_UNLOCK_THRESHOLD = 3;
const POSTER_UNLOCK_THRESHOLD = 7;
const MAX_GUESSES = 8;
const SHARE_URL = "https://mananssh.com/games/geetdle";

export function GeetdleApp({
  puzzleNumber: puzzleProp,
  archive = false,
}: {
  /** Which puzzle to play. Defaults to today's. Past puzzles pass an older number. */
  puzzleNumber?: number;
  /** True when playing an archived (past) puzzle, not today's. */
  archive?: boolean;
} = {}) {
  const [phase, setPhase] = useState<GeetdlePhase>("hub");
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [isWon, setIsWon] = useState(false);
  const [isLost, setIsLost] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [answer, setAnswer] = useState<GuessResponse["answer"]>(null);
  const [submitting, setSubmitting] = useState(false);
  // Gates the save effect so it can't overwrite saved progress with the empty
  // initial state before the load effect has restored it.
  const [hydrated, setHydrated] = useState(false);

  const puzzleNumber = useMemo(
    () => puzzleProp ?? getPuzzleNumber(),
    [puzzleProp],
  );

  const storageKey = `geetdle:v1:${puzzleNumber}`;

  // Restore saved progress for THIS puzzle on mount (per-puzzle, per-device).
  // Runs only in the browser; a refresh mid-game or after solving comes back to
  // the exact same state. Guarded so private mode / disabled storage degrades.
  useEffect(() => {
    // localStorage can only be read after mount (reading it during render would
    // desync SSR), so restoring saved state here necessarily sets state in an
    // effect — the canonical hydration exception to react-hooks/set-state-in-effect.
    /* eslint-disable react-hooks/set-state-in-effect */
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const s = JSON.parse(raw) as Partial<{
          guesses: Guess[];
          isWon: boolean;
          isLost: boolean;
          posterUrl: string | null;
          audioUrl: string | null;
          answer: GuessResponse["answer"];
          phase: GeetdlePhase;
        }>;
        if (Array.isArray(s.guesses) && s.guesses.length) setGuesses(s.guesses);
        if (s.isWon) setIsWon(true);
        if (s.isLost) setIsLost(true);
        if (s.posterUrl) setPosterUrl(s.posterUrl);
        if (s.audioUrl) setAudioUrl(s.audioUrl);
        if (s.answer) setAnswer(s.answer);
        if (s.phase && s.phase !== "hub") setPhase(s.phase);
      }
    } catch {
      /* no-op: storage unavailable */
    }
    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [storageKey]);

  // Persist progress whenever it changes (after hydration). Nothing to save
  // while still on the hub with no guesses.
  useEffect(() => {
    if (!hydrated) return;
    if (phase === "hub" && guesses.length === 0) return;
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ v: 1, guesses, isWon, isLost, posterUrl, audioUrl, answer, phase }),
      );
    } catch {
      /* no-op: storage unavailable */
    }
  }, [hydrated, storageKey, guesses, isWon, isLost, posterUrl, audioUrl, answer, phase]);

  const handleStartGame = () => setPhase("playing");
  const handleShare = () => setShowShare(true);

  const handleGuess = async (song: { id: string; title: string }) => {
    if (submitting || isWon || isLost) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/geetdle/guess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: song.id,
          guessNumber: guesses.length + 1,
          puzzle: puzzleNumber,
        }),
      });
      if (!res.ok) throw new Error(`guess failed: ${res.status}`);
      const data = (await res.json()) as GuessResponse;

      setGuesses((prev) => [
        ...prev,
        { song_title: data.guessTitle, feedback: data.feedback, timestamp: Date.now() },
      ]);
      // Hints, once revealed by the server, stay revealed.
      if (data.posterUrl) setPosterUrl(data.posterUrl);
      if (data.audioUrl) setAudioUrl(data.audioUrl);
      if (data.won) {
        setIsWon(true);
        setAnswer(data.answer);
        setPhase("won");
        setTimeout(() => setShowShare(true), 1000);
      } else if (data.lost) {
        setIsLost(true);
        setAnswer(data.answer);
        setPhase("lost");
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
            {archive ? `ARCHIVE · PUZZLE #${puzzleNumber}` : `DAILY PUZZLE #${puzzleNumber}`}
          </p>

          <h1
            className="geetdle-wordmark mb-5 text-6xl text-ink sm:mb-6 sm:text-7xl md:text-9xl"
            style={{ fontFamily: "var(--display-family)" }}
          >
            GEETDLE
          </h1>

          <p className="mx-auto mb-10 max-w-md text-balance text-base text-muted sm:text-lg">
            {archive
              ? "Replay an earlier daily puzzle. Guess the Bollywood song from category clues."
              : "Guess the Bollywood song from category clues. A new puzzle every day."}
          </p>

          <button
            onClick={handleStartGame}
            className="rounded-full bg-accent px-9 py-4 text-base font-semibold text-accent-ink transition-all hover:opacity-90 active:scale-[0.98]"
          >
            {archive ? "Play this puzzle" : "Play today’s puzzle"}
          </button>

          <div className="mt-6 text-sm">
            {archive ? (
              <Link href="/games/geetdle" className="text-muted transition-colors hover:text-ink">
                ← Today&apos;s puzzle
              </Link>
            ) : (
              <Link href="/games/geetdle/archive" className="text-muted transition-colors hover:text-ink">
                Past puzzles →
              </Link>
            )}
          </div>

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
                You get {MAX_GUESSES} guesses. An audio preview unlocks after{" "}
                {AUDIO_UNLOCK_THRESHOLD}, and the song poster after{" "}
                {POSTER_UNLOCK_THRESHOLD}.
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
              {archive ? "ARCHIVE · " : ""}PUZZLE #{puzzleNumber}
            </p>
            <p
              className="mt-2 text-sm text-muted"
              style={{ fontFamily: "var(--mono-family)" }}
            >
              {Math.min(guesses.length, MAX_GUESSES)} / {MAX_GUESSES} GUESSES
            </p>
            {archive && (
              <Link
                href="/games/geetdle"
                className="mt-2 inline-block text-xs text-muted transition-colors hover:text-ink"
              >
                ← Today&apos;s puzzle
              </Link>
            )}
          </div>

          {(isWon || isLost) && (
            <button
              onClick={handleShare}
              className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink transition-all hover:opacity-90 active:scale-[0.98]"
            >
              Share results
            </button>
          )}
        </div>

        <GameBoard
          guesses={guesses}
          posterUrl={posterUrl}
          audioUrl={audioUrl}
          isWon={isWon}
          isLost={isLost}
        />

        {!isWon && !isLost && (
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

        {isLost && answer && (
          <div className="mt-10">
            <div className="rounded-2xl border border-rule bg-surface p-8 text-center">
              <p
                className="mb-3 text-xs uppercase tracking-[0.2em]"
                style={{ fontFamily: "var(--mono-family)", color: "var(--wrong)" }}
              >
                Out of guesses — the song was
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
              <p className="mt-4 text-sm text-faint">
                Come back tomorrow for a new puzzle.
              </p>
            </div>
          </div>
        )}
      </div>

      {showShare && (
        <ShareModal
          displayText={generateShareText(guesses, puzzleNumber, undefined, isWon)}
          shareText={generateShareText(guesses, puzzleNumber, SHARE_URL, isWon)}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  );
}

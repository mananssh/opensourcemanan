"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import type {
  Guess,
  GeetdlePhase,
  CategoryFeedback,
  CatalogSong,
} from "@/lib/games/geetdle/types";
import {
  generateShareText,
  getPuzzleNumber,
  remainingPossibilities,
  summarizePossibilities,
} from "@/lib/games/geetdle/rules";
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

const MAX_GUESSES = 8;
const SHARE_URL = "https://mananssh.com/games/geetdle";
/** Bump when the saved shape changes — v2 stores each guess's full song. */
const STORAGE_VERSION = "v2";

export function GeetdleApp({
  puzzleNumber: puzzleProp,
  archive = false,
}: {
  /** Which puzzle to play. Defaults to today's. Past puzzles pass an older number. */
  puzzleNumber?: number;
  /** True when playing an archived (past) puzzle, not today's. */
  archive?: boolean;
} = {}) {
  // No "hub" gate — the board is the landing surface (see design brief revision).
  const [phase, setPhase] = useState<GeetdlePhase>("playing");
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [isWon, setIsWon] = useState(false);
  const [isLost, setIsLost] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [answer, setAnswer] = useState<GuessResponse["answer"]>(null);
  const [submitting, setSubmitting] = useState(false);
  const [catalog, setCatalog] = useState<CatalogSong[]>([]);
  // Gates the save effect so it can't overwrite saved progress with the empty
  // initial state before the load effect has restored it.
  const [hydrated, setHydrated] = useState(false);

  const puzzleNumber = useMemo(
    () => puzzleProp ?? getPuzzleNumber(),
    [puzzleProp],
  );

  const storageKey = `geetdle:${STORAGE_VERSION}:${puzzleNumber}`;

  // Fetch the lean catalog once — powers instant local search and the
  // possibilities filter. Cached hard at the edge, so this is cheap.
  useEffect(() => {
    let alive = true;
    fetch("/api/geetdle/catalog")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d: { songs: CatalogSong[] }) => {
        if (alive) setCatalog(d.songs ?? []);
      })
      .catch((err) => console.error("[geetdle] catalog load failed", err));
    return () => {
      alive = false;
    };
  }, []);

  // Restore saved progress for THIS puzzle on mount (per-puzzle, per-device).
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
        if (s.phase === "won" || s.phase === "lost") setPhase(s.phase);
      }
    } catch {
      /* no-op: storage unavailable */
    }
    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [storageKey]);

  // Persist progress whenever it changes (after hydration). Nothing to save
  // until the first guess.
  useEffect(() => {
    if (!hydrated) return;
    if (guesses.length === 0) return;
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ v: 2, guesses, isWon, isLost, posterUrl, audioUrl, answer, phase }),
      );
    } catch {
      /* no-op: storage unavailable */
    }
  }, [hydrated, storageKey, guesses, isWon, isLost, posterUrl, audioUrl, answer, phase]);

  // Narrow the catalog by every guess so far → the hover "Possibilities" panel.
  const possibilities = useMemo(() => {
    if (catalog.length === 0 || guesses.length === 0) return null;
    return summarizePossibilities(remainingPossibilities(catalog, guesses));
  }, [catalog, guesses]);

  const handleShare = () => setShowShare(true);

  const handleGuess = async (song: CatalogSong) => {
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
        {
          song_title: data.guessTitle,
          feedback: data.feedback,
          timestamp: Date.now(),
          song, // full fields — powers the client-side possibilities filter
        },
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

  return (
    <div className="container mx-auto px-5 py-10">
      <div className="mx-auto max-w-3xl">
        {/* Slim hero — brand + puzzle number (the old "Play" gate is gone). */}
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p
              className="text-xs tracking-[0.2em] text-faint"
              style={{ fontFamily: "var(--mono-family)" }}
            >
              {archive ? `ARCHIVE · PUZZLE #${puzzleNumber}` : `DAILY · PUZZLE #${puzzleNumber}`}
            </p>
            <h1
              className="geetdle-wordmark mt-1 text-4xl text-ink sm:text-5xl"
              style={{ fontFamily: "var(--display-family)" }}
            >
              GEETDLE
            </h1>
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
          possibilities={possibilities}
        />

        {!isWon && !isLost && (
          <div className="mt-8">
            <GuessInput
              catalog={catalog}
              onGuess={handleGuess}
              disabled={submitting || catalog.length === 0}
              autoFocus
            />
            {catalog.length === 0 && (
              <p className="mt-2 pl-1 text-xs text-faint">Loading songs…</p>
            )}
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
                style={{ fontFamily: "var(--mono-family)", color: "var(--wrong-ink)" }}
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

        <div className="mt-10 text-center text-sm">
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

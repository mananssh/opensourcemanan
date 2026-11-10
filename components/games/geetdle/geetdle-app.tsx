"use client";

import { useState, useEffect, useMemo } from "react";
import type { BollywoodSong, Guess, GeetdlePhase } from "@/lib/games/geetdle/types";
import { loadSongs, findSongByTitle, getAutocompleteSuggestions } from "@/lib/games/geetdle/data";
import { checkGuess, isWinningGuess, getDailySongIndex, generateShareText } from "@/lib/games/geetdle/rules";
import { GameBoard } from "./game-board";
import { GuessInput } from "./guess-input";
import { ShareModal } from "./share-modal";

export function GeetdleApp() {
  const [phase, setPhase] = useState<GeetdlePhase>("hub");
  const [songs, setSongs] = useState<BollywoodSong[]>([]);
  const [dailySong, setDailySong] = useState<BollywoodSong | null>(null);
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [isWon, setIsWon] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [posterUnlocked, setPosterUnlocked] = useState(false);

  // Poster unlock threshold
  const POSTER_UNLOCK_THRESHOLD = 3;

  // Load songs and set daily song
  useEffect(() => {
    const allSongs = loadSongs();
    setSongs(allSongs);

    const todayIndex = getDailySongIndex(allSongs.length);
    setDailySong(allSongs[todayIndex]);
  }, []);

  const puzzleNumber = useMemo(() => {
    if (!songs.length) return 0;
    const epoch = new Date("2024-01-01T00:00:00Z");
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return Math.floor((now.getTime() - epoch.getTime()) / (1000 * 60 * 60 * 24));
  }, [songs]);

  const handleStartGame = () => {
    setPhase("playing");
  };

  const handleGuess = (songTitle: string) => {
    if (!dailySong) return;

    const guessSong = findSongByTitle(songTitle, songs);
    if (!guessSong) {
      alert("Song not found in database. Please select from autocomplete.");
      return;
    }

    const feedback = checkGuess(guessSong, dailySong);
    const won = isWinningGuess(feedback);

    const newGuess: Guess = {
      song_title: guessSong.song_title,
      feedback,
      timestamp: Date.now(),
    };

    const newGuesses = [...guesses, newGuess];
    setGuesses(newGuesses);

    if (won) {
      setIsWon(true);
      setPhase("won");
      setTimeout(() => setShowShare(true), 1000);
    }

    // Unlock poster after threshold
    if (newGuesses.length >= POSTER_UNLOCK_THRESHOLD) {
      setPosterUnlocked(true);
    }
  };

  const handleShare = () => {
    setShowShare(true);
  };

  if (phase === "hub") {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <p
            className="text-sm tracking-wider text-muted mb-4"
            style={{ fontFamily: "var(--mono-family)" }}
          >
            DAILY PUZZLE #{puzzleNumber}
          </p>

          <h1
            className="geetdle-wordmark text-6xl md:text-8xl text-ink mb-6"
            style={{ fontFamily: "var(--display-family)" }}
          >
            GEETDLE
          </h1>

          <p className="text-lg text-muted mb-8 max-w-xl mx-auto">
            Guess the Bollywood song from category clues. New puzzle daily.
          </p>

          <button
            onClick={handleStartGame}
            className="px-8 py-4 bg-accent text-accent-ink font-semibold rounded-md hover:opacity-90 transition-opacity text-lg"
          >
            PLAY TODAY&apos;S PUZZLE
          </button>

          <div className="mt-12 pt-12 border-t border-rule">
            <h2 className="text-xl font-semibold mb-4">How to Play</h2>
            <div className="text-left max-w-lg mx-auto space-y-3 text-sm text-muted">
              <p>• Guess the daily Bollywood song from category hints</p>
              <p>• Categories: Music Director, Singer(s), Year, Movie, Language, Genre</p>
              <p>• 🟩 Green = Exact match</p>
              <p>• 🟨 Yellow = Partial/Close (±1 year or partial singer match)</p>
              <p>• ⬜ Gray = Wrong (↑↓ shows year direction)</p>
              <p>• Movie poster unlocks after {POSTER_UNLOCK_THRESHOLD} guesses</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!dailySong) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-muted">Loading today&apos;s puzzle...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p
              className="text-sm tracking-wider text-muted"
              style={{ fontFamily: "var(--mono-family)" }}
            >
              PUZZLE #{puzzleNumber}
            </p>
            <p className="text-sm text-faint mt-1">
              {guesses.length} guess{guesses.length !== 1 ? "es" : ""}
            </p>
          </div>

          {isWon && (
            <button
              onClick={handleShare}
              className="px-4 py-2 bg-accent text-accent-ink font-medium rounded-md hover:opacity-90 transition-opacity"
            >
              Share Results
            </button>
          )}
        </div>

        <GameBoard
          guesses={guesses}
          dailySong={dailySong}
          posterUnlocked={posterUnlocked}
          isWon={isWon}
        />

        {!isWon && (
          <div className="mt-8">
            <GuessInput
              songs={songs}
              onGuess={handleGuess}
              getAutocompleteSuggestions={getAutocompleteSuggestions}
            />
          </div>
        )}

        {isWon && (
          <div className="mt-8 text-center">
            <div className="bg-success/10 border border-success rounded-lg p-6">
              <h2 className="text-2xl font-bold text-success mb-2">
                🎉 Solved in {guesses.length} guess{guesses.length !== 1 ? "es" : ""}!
              </h2>
              <p className="text-lg text-ink mb-1">{dailySong.song_title}</p>
              <p className="text-muted text-sm">
                from {dailySong.movie} ({dailySong.year})
              </p>
            </div>
          </div>
        )}
      </div>

      {showShare && (
        <ShareModal
          shareText={generateShareText(guesses, puzzleNumber)}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  );
}

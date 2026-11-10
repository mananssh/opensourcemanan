/**
 * Bollywood Stumple game rules and logic
 */

import type {
  BollywoodSong,
  CategoryFeedback,
  CategoryKey,
  MatchState,
  Guess,
} from "./types";

/**
 * Check if a guess matches the target song and return feedback
 */
export function checkGuess(
  guessSong: BollywoodSong,
  targetSong: BollywoodSong
): CategoryFeedback[] {
  const feedback: CategoryFeedback[] = [];

  // Music Director - exact match (case-insensitive)
  feedback.push({
    category: "music_director",
    state: matchExact(guessSong.music_director, targetSong.music_director),
    value: guessSong.music_director,
  });

  // Singer(s) - partial match if any singer matches
  const guessState = matchSingers(guessSong.singers, targetSong.singers);
  feedback.push({
    category: "singers",
    state: guessState,
    value: guessSong.singers,
  });

  // Year - exact, ±1, or wrong with direction
  const yearState = matchYear(guessSong.year, targetSong.year);
  feedback.push({
    category: "year",
    state: yearState.state,
    value: String(guessSong.year),
    direction: yearState.direction,
  });

  // Movie - exact match
  feedback.push({
    category: "movie",
    state: matchExact(guessSong.movie, targetSong.movie),
    value: guessSong.movie,
  });

  // Language - exact match
  feedback.push({
    category: "language",
    state: matchExact(guessSong.language, targetSong.language),
    value: guessSong.language,
  });

  // Genre - exact match
  feedback.push({
    category: "genre",
    state: matchExact(guessSong.genre, targetSong.genre),
    value: guessSong.genre,
  });

  return feedback;
}

/**
 * Check if guess is an exact match (case-insensitive)
 */
function matchExact(guess: string, target: string): MatchState {
  return normalize(guess) === normalize(target) ? "exact" : "wrong";
}

/**
 * Check if any singer in the guess matches any in the target
 */
function matchSingers(guess: string, target: string): MatchState {
  const guessSingers = guess
    .split(",")
    .map((s) => normalize(s.trim()))
    .filter(Boolean);
  const targetSingers = target
    .split(",")
    .map((s) => normalize(s.trim()))
    .filter(Boolean);

  // Exact match: all singers match
  if (
    guessSingers.length === targetSingers.length &&
    guessSingers.every((g) => targetSingers.includes(g))
  ) {
    return "exact";
  }

  // Partial match: at least one singer matches
  if (guessSingers.some((g) => targetSingers.includes(g))) {
    return "partial";
  }

  return "wrong";
}

/**
 * Check year match with direction
 */
function matchYear(
  guess: number,
  target: number
): { state: MatchState; direction?: "up" | "down" } {
  if (guess === target) {
    return { state: "exact" };
  }

  const diff = Math.abs(guess - target);
  if (diff === 1) {
    return {
      state: "partial",
      direction: guess < target ? "up" : "down",
    };
  }

  return {
    state: "wrong",
    direction: guess < target ? "up" : "down",
  };
}

/**
 * Normalize string for comparison (lowercase, trim, remove extra spaces)
 */
function normalize(str: string): string {
  return str.toLowerCase().trim().replace(/\s+/g, " ");
}

/**
 * Check if the guess won the game
 */
export function isWinningGuess(feedback: CategoryFeedback[]): boolean {
  return feedback.every((f) => f.state === "exact");
}

/**
 * Get daily song index based on date
 */
export function getDailySongIndex(totalSongs: number, date = new Date()): number {
  // Use a fixed epoch (Jan 1, 2024) to calculate days elapsed
  const epoch = new Date("2024-01-01T00:00:00Z");
  const now = new Date(date);
  now.setHours(0, 0, 0, 0);

  const daysSinceEpoch = Math.floor(
    (now.getTime() - epoch.getTime()) / (1000 * 60 * 60 * 24)
  );

  return daysSinceEpoch % totalSongs;
}

/**
 * Generate shareable emoji grid
 */
export function generateShareText(guesses: Guess[], puzzleNumber: number): string {
  const header = `Bollywood Stumple #${puzzleNumber}\n`;
  const grid = guesses
    .map((guess) => {
      return guess.feedback
        .map((f) => {
          if (f.state === "exact") return "🟩";
          if (f.state === "partial") return "🟨";
          return "⬜";
        })
        .join("");
    })
    .join("\n");

  return header + grid;
}

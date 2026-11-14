/**
 * Geetdle game types
 */

export type BollywoodSong = {
  song_title: string;
  movie: string;
  music_director: string;
  singers: string; // comma-separated
  year: number;
  language: string;
  genre: string;
  youtube_url: string;
  popularity_score?: number;
};

/**
 * The lean, client-safe catalog row. The full catalog of these ships to the
 * browser for instant local search and the "possibilities" filter — it carries
 * only guessable fields, never the audio/poster hints and never a flag marking
 * which row is today's answer (the pick + scoring stay server-side).
 */
export type CatalogSong = {
  id: string;
  song_title: string;
  movie: string;
  music_director: string;
  singers: string; // comma-separated
  year: number;
  genre: string;
  popularity: number | null;
};

/** The five scored clue columns (Language was dropped — always green on a Hindi-only catalog). */
export type CategoryKey =
  | "music_director"
  | "singers"
  | "year"
  | "movie"
  | "genre";

/**
 * Tile feedback states, strongest → weakest:
 * - `exact`        — green
 * - `partial`      — strong amber (±2 years · same genre-family · shared singer)
 * - `partial-weak` — pale amber (same decade but >2 years apart)
 * - `wrong`        — neutral
 */
export type MatchState = "exact" | "partial" | "partial-weak" | "wrong" | "none";

export type CategoryFeedback = {
  category: CategoryKey;
  state: MatchState;
  value: string;
  direction?: "up" | "down"; // for year only
};

export type Guess = {
  song_title: string;
  feedback: CategoryFeedback[];
  timestamp: number;
  /**
   * The full lean fields of the guessed song. Stored so the client can replay
   * `checkGuess(this, candidate)` over the catalog to compute which songs are
   * still possible (the hover "Possibilities" panel). Optional for back-compat
   * with pre-v2 saves.
   */
  song?: CatalogSong;
};

export type GameState = {
  dailySong: BollywoodSong;
  guesses: Guess[];
  isWon: boolean;
  isRevealed: boolean;
  posterUnlocked: boolean;
};

export type GeetdlePhase = "hub" | "playing" | "won" | "lost";

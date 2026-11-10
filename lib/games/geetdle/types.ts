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

export type CategoryKey =
  | "music_director"
  | "singers"
  | "year"
  | "movie"
  | "language"
  | "genre";

export type MatchState = "exact" | "partial" | "wrong" | "none";

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
};

export type GameState = {
  dailySong: BollywoodSong;
  guesses: Guess[];
  isWon: boolean;
  isRevealed: boolean;
  posterUnlocked: boolean;
};

export type GeetdlePhase = "hub" | "playing" | "won" | "lost";

/**
 * Load and enrich Bollywood songs data
 */

import type { BollywoodSong } from "./types";
import songsData from "@/content/games/geetdle/songs.json";

/**
 * Infer language from movie name, singers, or default to Hindi
 */
function inferLanguage(song: any): string {
  // Check for common Punjabi indicators
  if (
    song.singers?.toLowerCase().includes("diljit") ||
    song.movie?.toLowerCase().includes("punjab") ||
    song.singers?.toLowerCase().includes("gurdas maan")
  ) {
    return "Punjabi";
  }

  // Check for common Tamil/Telugu indicators
  if (
    song.singers?.toLowerCase().includes("s.p. balasubrahmanyam") ||
    song.singers?.toLowerCase().includes("p. susheela")
  ) {
    return "Tamil";
  }

  // Default to Hindi for Bollywood
  return "Hindi";
}

/**
 * Infer genre from era, music director, and context
 */
function inferGenre(song: any): string {
  const year = song.year;
  const musicDirector = song.music_director?.toLowerCase() || "";
  const singers = song.singers?.toLowerCase() || "";

  // Ghazal
  if (
    singers.includes("jagjit") ||
    singers.includes("pankaj udhas") ||
    singers.includes("ghulam ali")
  ) {
    return "Ghazal";
  }

  // Sufi
  if (
    singers.includes("kailash kher") ||
    singers.includes("rahat fateh") ||
    singers.includes("nusrat")
  ) {
    return "Sufi";
  }

  // Item Number / Dance
  if (
    singers.includes("sunidhi") ||
    (year >= 2000 && musicDirector.includes("pritam"))
  ) {
    return "Dance";
  }

  // Romantic
  if (
    singers.includes("arijit") ||
    singers.includes("shreya") ||
    singers.includes("lata") ||
    singers.includes("rafi")
  ) {
    return "Romantic";
  }

  // Classical / Golden Era
  if (year < 1970) {
    return "Classic";
  }

  // Contemporary
  if (year >= 2010) {
    return "Contemporary";
  }

  // Default
  return "Romantic";
}

/**
 * Enrich song data with inferred fields
 */
function enrichSong(song: any): BollywoodSong {
  return {
    song_title: song.song_title,
    movie: song.movie,
    music_director: song.music_director,
    singers: song.singers,
    year: song.year,
    youtube_url: song.youtube_url,
    popularity_score: song.popularity_score,
    language: inferLanguage(song),
    genre: inferGenre(song),
  };
}

/**
 * Load all enriched songs
 */
export function loadSongs(): BollywoodSong[] {
  return songsData.songs.map(enrichSong);
}

/**
 * Find song by title (case-insensitive, fuzzy)
 */
export function findSongByTitle(
  title: string,
  songs: BollywoodSong[]
): BollywoodSong | null {
  const normalized = title.toLowerCase().trim();

  // Exact match first
  const exact = songs.find(
    (s) => s.song_title.toLowerCase().trim() === normalized
  );
  if (exact) return exact;

  // Fuzzy match (contains)
  const fuzzy = songs.find((s) =>
    s.song_title.toLowerCase().includes(normalized)
  );
  return fuzzy || null;
}

/**
 * Get autocomplete suggestions
 */
export function getAutocompleteSuggestions(
  query: string,
  songs: BollywoodSong[],
  limit = 10
): BollywoodSong[] {
  if (!query || query.length < 2) return [];

  const normalized = query.toLowerCase().trim();

  return songs
    .filter((s) => s.song_title.toLowerCase().includes(normalized))
    .slice(0, limit);
}

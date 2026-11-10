"use client";

import { useState, useRef, useEffect } from "react";
import type { BollywoodSong } from "@/lib/games/geetdle/types";

interface GuessInputProps {
  songs: BollywoodSong[];
  onGuess: (songTitle: string) => void;
  getAutocompleteSuggestions: (
    query: string,
    songs: BollywoodSong[],
    limit?: number
  ) => BollywoodSong[];
}

export function GuessInput({ songs, onGuess, getAutocompleteSuggestions }: GuessInputProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<BollywoodSong[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (query.length >= 2) {
      const results = getAutocompleteSuggestions(query, songs, 8);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
      setSelectedIndex(-1);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [query, songs, getAutocompleteSuggestions]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const songTitle =
      selectedIndex >= 0 ? suggestions[selectedIndex].song_title : query;

    if (!songTitle.trim()) return;

    onGuess(songTitle);
    setQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (song: BollywoodSong) => {
    onGuess(song.song_title);
    setQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => query.length >= 2 && setShowSuggestions(true)}
            placeholder="Type song name..."
            className="w-full px-4 py-3 border border-input rounded-md bg-paper text-ink placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-ring"
          />

          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-paper border border-rule rounded-md shadow-lg max-h-64 overflow-y-auto">
              {suggestions.map((song, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSuggestionClick(song)}
                  className={`w-full px-4 py-3 text-left hover:bg-surface transition-colors ${
                    idx === selectedIndex ? "bg-surface" : ""
                  }`}
                >
                  <div className="font-medium text-ink text-sm">
                    {song.song_title}
                  </div>
                  <div className="text-xs text-muted mt-1">
                    {song.movie} ({song.year}) • {song.singers}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          className="px-6 py-3 bg-accent text-accent-ink font-semibold rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
          disabled={!query.trim()}
        >
          Guess
        </button>
      </form>

      <p className="text-xs text-faint mt-2">
        Start typing to see song suggestions from the database
      </p>
    </div>
  );
}

"use client";

import { useState, useRef, useMemo, useCallback } from "react";
import Fuse from "fuse.js";
import type { CatalogSong } from "@/lib/games/geetdle/types";

interface GuessInputProps {
  /** The full lean catalog, shipped to the client — search runs locally, instantly. */
  catalog: CatalogSong[];
  onGuess: (song: CatalogSong) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}

const MAX_SUGGESTIONS = 8;

export function GuessInput({
  catalog,
  onGuess,
  disabled = false,
  autoFocus = false,
}: GuessInputProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  // Instant, local fuzzy match. Fuse tolerates typos, phonetic slips, and the
  // many valid Hindi transliterations (khwabon ↔ khaabon) that exact substring
  // matching misses, so a near-miss spelling still surfaces the right song.
  // Title is weighted highest, then movie, then singers — and the catalog ships
  // pre-sorted by popularity, so we break near-ties in Fuse's score by that
  // order to keep the obvious songs on top. All local: no round-trip per key.
  const fuse = useMemo(
    () =>
      new Fuse(catalog, {
        keys: [
          { name: "song_title", weight: 0.6 },
          { name: "movie", weight: 0.25 },
          { name: "singers", weight: 0.15 },
        ],
        includeScore: true,
        threshold: 0.4,
        ignoreLocation: true,
        minMatchCharLength: 2,
      }),
    [catalog],
  );

  const suggestions = useMemo(() => {
    const q = query.trim();
    if (q.length < 2) return [];
    return fuse
      .search(q)
      .sort((a, b) => {
        const byScore = (a.score ?? 0) - (b.score ?? 0);
        // Within a hair of each other on relevance? Prefer the more popular
        // song (lower refIndex, since the catalog is popularity-sorted).
        if (Math.abs(byScore) > 0.02) return byScore;
        return a.refIndex - b.refIndex;
      })
      .slice(0, MAX_SUGGESTIONS)
      .map((r) => r.item);
  }, [query, fuse]);

  const showSuggestions = open && suggestions.length > 0;

  const submit = useCallback(
    (song: CatalogSong) => {
      onGuess(song);
      setQuery("");
      setOpen(false);
      setSelectedIndex(-1);
    },
    [onGuess],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled || suggestions.length === 0) return;
    const pick = selectedIndex >= 0 ? suggestions[selectedIndex] : suggestions[0];
    if (pick) submit(pick);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((p) => (p < suggestions.length - 1 ? p + 1 : p));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((p) => (p > 0 ? p - 1 : -1));
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="flex gap-2.5">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            name="geetdle-guess"
            aria-label="Guess a Bollywood song"
            autoComplete="off"
            value={query}
            autoFocus={autoFocus}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              setSelectedIndex(-1);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setOpen(true)}
            placeholder="Type a song name…"
            disabled={disabled}
            className="w-full rounded-full border border-input bg-surface px-5 py-3.5 text-ink placeholder:text-faint transition-shadow focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          />

          {showSuggestions && (
            <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-rule bg-paper shadow-xl shadow-black/5">
              <div className="max-h-72 overflow-y-auto p-1.5">
                {suggestions.map((song, idx) => (
                  <button
                    key={song.id}
                    type="button"
                    onClick={() => submit(song)}
                    className={`flex w-full flex-col gap-0.5 rounded-xl px-4 py-2.5 text-left transition-colors ${
                      idx === selectedIndex ? "bg-surface" : "hover:bg-surface"
                    }`}
                  >
                    <span className="text-sm font-medium text-ink">
                      {song.song_title}
                    </span>
                    <span className="text-xs text-muted">
                      {song.movie} ({song.year}) · {song.singers}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          className="rounded-full bg-accent px-7 py-3.5 font-semibold text-accent-ink transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40"
          disabled={disabled || suggestions.length === 0}
        >
          Guess
        </button>
      </form>

      <p
        className="mt-3 pl-1 text-xs tracking-wide text-faint"
        style={{ fontFamily: "var(--mono-family)" }}
      >
        START TYPING TO SEARCH THE DATABASE
      </p>
    </div>
  );
}

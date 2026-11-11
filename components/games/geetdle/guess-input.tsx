"use client";

import { useState, useRef, useEffect, useCallback } from "react";

type Suggestion = {
  id: string;
  title: string;
  movie: string;
  year: number;
  singers: string;
};

interface GuessInputProps {
  onGuess: (song: { id: string; title: string }) => void;
  disabled?: boolean;
}

export function GuessInput({ onGuess, disabled = false }: GuessInputProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Debounced server search. All state updates happen inside the async
  // callback (never synchronously in the effect body).
  useEffect(() => {
    const q = query.trim();
    const t = setTimeout(async () => {
      if (q.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      try {
        const res = await fetch(
          `/api/geetdle/search?q=${encodeURIComponent(q)}`,
          { signal: ctrl.signal },
        );
        if (!res.ok) return;
        const data = (await res.json()) as { results: Suggestion[] };
        setSuggestions(data.results);
        setShowSuggestions(data.results.length > 0);
        setSelectedIndex(-1);
      } catch {
        /* aborted or network error — ignore */
      }
    }, 180);
    return () => clearTimeout(t);
  }, [query]);

  const submit = useCallback(
    (song: Suggestion) => {
      onGuess({ id: song.id, title: song.title });
      setQuery("");
      setSuggestions([]);
      setShowSuggestions(false);
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
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((p) => (p < suggestions.length - 1 ? p + 1 : p));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((p) => (p > 0 ? p - 1 : -1));
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="flex gap-2.5">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            placeholder="Type a song name…"
            disabled={disabled}
            className="w-full rounded-full border border-input bg-surface px-5 py-3.5 text-ink placeholder:text-faint transition-shadow focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          />

          {showSuggestions && suggestions.length > 0 && (
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
                      {song.title}
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

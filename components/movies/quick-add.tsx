"use client";

import { useEffect, useRef, useState } from "react";
import type { TmdbResult } from "@/lib/movies/tmdb";
import type { WatchStatusValue } from "@/lib/movies/queries";
import { posterUrl } from "@/lib/movies/images";
import { mediaTypeLabel } from "@/lib/movies/format";

/**
 * The habit mechanic: type a title, live suggestions drop down, tap (or press
 * Enter) to log it as watched; "Queue" adds it to the watchlist instead.
 * Debounced against /api/movies/search (results cached server-side). Full
 * keyboard nav (↑/↓/Enter/Esc). If TMDB isn't configured, it says so instead of
 * silently showing "no matches".
 */
export function QuickAdd({
  onPick,
  busyId,
}: {
  onPick: (result: TmdbResult, status: WatchStatusValue) => void;
  busyId: number | null;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TmdbResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [active, setActive] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      const t = setTimeout(() => {
        setResults([]);
        setLoading(false);
      }, 0);
      return () => clearTimeout(t);
    }
    const t = setTimeout(async () => {
      setLoading(true);
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      try {
        const res = await fetch(`/api/movies/search?q=${encodeURIComponent(q)}`, {
          signal: ac.signal,
        });
        const data = (await res.json()) as {
          results?: TmdbResult[];
          configured?: boolean;
        };
        setResults(data.results ?? []);
        setConfigured(data.configured !== false);
        setActive(0);
        setOpen(true);
      } catch {
        /* aborted or network — ignore */
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  function choose(r: TmdbResult, status: WatchStatusValue) {
    onPick(r, status);
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      const r = results[active];
      if (r) {
        e.preventDefault();
        choose(r, "watched");
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const showPanel = open && query.trim().length >= 2;

  return (
    <div className="relative">
      <label className="sr-only" htmlFor="reel-search">
        Search films and TV
      </label>
      <div className="flex items-center gap-3 border border-rule bg-surface px-4 py-3 transition-colors focus-within:border-accent">
        <span aria-hidden className="font-mono text-accent-2">
          ▸
        </span>
        <input
          id="reel-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => results.length && setOpen(true)}
          placeholder="Log a film or show you watched…"
          autoComplete="off"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls="reel-search-list"
          aria-autocomplete="list"
          className="w-full bg-transparent font-body text-base text-ink outline-none placeholder:text-faint"
        />
        {loading && (
          <span className="font-mono text-[0.65rem] uppercase tracking-widest text-faint">
            …
          </span>
        )}
      </div>

      {showPanel && (
        <>
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            className="fixed inset-0 z-30 cursor-default"
            onClick={() => setOpen(false)}
          />
          <ul
            id="reel-search-list"
            role="listbox"
            className="absolute left-0 right-0 z-40 mt-2 max-h-[26rem] overflow-auto rounded-sm border border-rule bg-paper p-1 shadow-lg"
          >
            {results.length === 0 && !loading && configured && (
              <li className="px-3 py-4 text-center font-mono text-xs uppercase tracking-widest text-faint">
                No matches
              </li>
            )}
            {results.length === 0 && !loading && !configured && (
              <li className="px-3 py-4 text-center font-mono text-[0.7rem] leading-relaxed text-faint">
                Search isn&rsquo;t configured. Add{" "}
                <span className="text-accent">TMDB_API_KEY</span> to enable
                suggestions.
              </li>
            )}
            {results.map((r, i) => {
              const busy = busyId === r.tmdbId;
              return (
                <li
                  key={`${r.mediaType}-${r.tmdbId}`}
                  role="option"
                  aria-selected={i === active}
                >
                  <div
                    onMouseEnter={() => setActive(i)}
                    className={`flex items-center gap-3 rounded-sm px-2 py-2 transition-colors ${
                      i === active ? "bg-accent-soft" : ""
                    }`}
                  >
                    <div className="h-14 w-10 shrink-0 overflow-hidden rounded-[2px] border border-rule bg-surface">
                      {posterUrl(r.posterPath, "w92") ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={posterUrl(r.posterPath, "w92")!}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => choose(r, "watched")}
                      className="flex-1 text-left disabled:opacity-50"
                    >
                      <span className="block font-body text-base font-semibold leading-tight text-ink">
                        {r.title}
                      </span>
                      <span className="font-mono text-[0.65rem] uppercase tracking-[0.15em] text-faint">
                        {mediaTypeLabel(r.mediaType)}
                        {r.releaseYear ? ` · ${r.releaseYear}` : ""}
                      </span>
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => choose(r, "watchlist")}
                      className="shrink-0 border border-rule px-2.5 py-1 font-mono text-[0.6rem] uppercase tracking-[0.15em] text-muted transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
                    >
                      Queue
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

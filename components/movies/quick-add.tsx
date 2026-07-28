"use client";

import { useEffect, useRef, useState } from "react";
import type { TmdbResult } from "@/lib/movies/tmdb";
import type { WatchStatusValue } from "@/lib/movies/queries";
import { posterUrl } from "@/lib/movies/images";
import { mediaTypeLabel } from "@/lib/movies/format";

/**
 * The habit mechanic: type a title, tap a result, it's logged as watched. A
 * secondary "queue" adds it to the watchlist instead. Debounced against
 * /api/movies/search; results are cached server-side so repeats are instant.
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
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      // Clear in a timeout so no setState runs synchronously in the effect body.
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
        const data = (await res.json()) as { results?: TmdbResult[] };
        setResults(data.results ?? []);
        setOpen(true);
      } catch {
        /* aborted or network — ignore */
      } finally {
        setLoading(false);
      }
    }, 280);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div className="relative">
      <label className="sr-only" htmlFor="reel-search">
        Search films and TV
      </label>
      <div className="flex items-center gap-3 rounded-sm border-2 border-ink bg-surface px-4 py-3 shadow-[3px_3px_0_0_var(--rule)] focus-within:border-accent">
        <span aria-hidden className="font-mono text-accent">
          ▸
        </span>
        <input
          id="reel-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length && setOpen(true)}
          placeholder="Log a film or show you watched…"
          autoComplete="off"
          className="w-full bg-transparent font-body text-base text-ink outline-none placeholder:text-faint"
        />
        {loading && (
          <span className="font-mono text-[0.65rem] uppercase tracking-widest text-faint">
            …
          </span>
        )}
      </div>

      {open && query.trim().length >= 2 && (
        <>
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            className="fixed inset-0 z-30 cursor-default"
            onClick={() => setOpen(false)}
          />
          <ul className="absolute left-0 right-0 z-40 mt-2 max-h-[26rem] overflow-auto rounded-sm border border-rule bg-paper p-1 shadow-lg">
            {results.length === 0 && !loading && (
              <li className="px-3 py-4 text-center font-mono text-xs uppercase tracking-widest text-faint">
                No matches
              </li>
            )}
            {results.map((r) => {
              const busy = busyId === r.tmdbId;
              return (
                <li key={`${r.mediaType}-${r.tmdbId}`}>
                  <div className="flex items-center gap-3 rounded-sm px-2 py-2 hover:bg-accent-soft/60">
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
                      onClick={() => {
                        onPick(r, "watched");
                        setQuery("");
                        setResults([]);
                        setOpen(false);
                      }}
                      className="flex-1 text-left disabled:opacity-50"
                    >
                      <span className="block font-display text-base font-medium leading-tight text-ink">
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
                      onClick={() => {
                        onPick(r, "watchlist");
                        setQuery("");
                        setResults([]);
                        setOpen(false);
                      }}
                      className="shrink-0 rounded-full border border-rule px-2.5 py-1 font-mono text-[0.6rem] uppercase tracking-[0.15em] text-muted transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
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

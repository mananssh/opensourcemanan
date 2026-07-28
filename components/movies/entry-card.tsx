"use client";

import { useState } from "react";
import type { MovieCard, WatchStatusValue } from "@/lib/movies/queries";
import { formatRuntime, mediaTypeLabel } from "@/lib/movies/format";
import { Poster } from "@/components/movies/poster";
import { StarRating } from "@/components/movies/star-rating";
import { HeartIcon } from "@/components/movies/icons";
import type { UpdateEntryInput } from "@/app/movies/actions";

const STATUS_LABEL: Record<WatchStatusValue, string> = {
  watched: "Watched",
  watching: "Watching",
  watchlist: "Watchlist",
};

/**
 * One logged title as a ticket stub: poster stub on the left, a perforated
 * divider, details + inline controls on the right. All edits flow up to the
 * library, which owns optimistic state and the server action.
 */
export function EntryCard({
  entry,
  onUpdate,
  onRemove,
  busy,
}: {
  entry: MovieCard;
  onUpdate: (patch: Omit<UpdateEntryInput, "id">) => void;
  onRemove: () => void;
  busy: boolean;
}) {
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState(entry.note ?? "");
  const [confirming, setConfirming] = useState(false);
  const runtime = formatRuntime(entry.runtimeMinutes);

  return (
    <article
      className={`group relative flex overflow-hidden rounded-sm border border-rule bg-surface transition-shadow hover:shadow-[3px_3px_0_0_var(--rule)] ${
        busy ? "opacity-60" : ""
      }`}
    >
      <div className="w-20 shrink-0 p-2 sm:w-24">
        <Poster url={entry.posterUrl} title={entry.title} mediaType={entry.mediaType} />
      </div>

      {/* Perforated divider (the ticket tear line). */}
      <div
        aria-hidden
        className="my-2 border-l-2 border-dashed border-rule"
      />

      <div className="flex min-w-0 flex-1 flex-col gap-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-display text-lg font-semibold leading-tight text-ink">
              {entry.title}
            </h3>
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.15em] text-faint">
              {mediaTypeLabel(entry.mediaType)}
              {entry.releaseYear ? ` · ${entry.releaseYear}` : ""}
              {runtime ? ` · ${runtime}` : ""}
              {entry.rewatches > 0 ? ` · ×${entry.rewatches + 1}` : ""}
            </p>
          </div>
          <button
            type="button"
            aria-pressed={entry.favorite}
            aria-label={entry.favorite ? "Unfavorite" : "Favorite"}
            onClick={() => onUpdate({ favorite: !entry.favorite })}
            className={`shrink-0 transition-colors ${
              entry.favorite ? "text-accent" : "text-faint hover:text-accent"
            }`}
          >
            <HeartIcon filled={entry.favorite} className="h-5 w-5" />
          </button>
        </div>

        <StarRating value={entry.rating} onChange={(rating) => onUpdate({ rating })} />

        {entry.mediaType === "tv" && (
          <EpisodeProgress
            watched={entry.episodesWatched}
            total={entry.episodesTotal}
            seasons={entry.seasonsTotal}
            onSet={(n) => onUpdate({ episodesWatched: n })}
          />
        )}

        <div className="mt-auto flex flex-wrap items-center gap-2">
          <select
            value={entry.status}
            aria-label="Status"
            onChange={(e) => onUpdate({ status: e.target.value as WatchStatusValue })}
            className="rounded-full border border-rule bg-paper px-2.5 py-1 font-mono text-[0.62rem] uppercase tracking-[0.12em] text-muted outline-none focus:border-accent"
          >
            {(["watched", "watching", "watchlist"] as WatchStatusValue[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setNoteOpen((v) => !v)}
            className="rounded-full border border-rule px-2.5 py-1 font-mono text-[0.62rem] uppercase tracking-[0.12em] text-muted transition-colors hover:border-accent hover:text-accent"
          >
            {entry.note ? "Note ✓" : "＋ Note"}
          </button>

          {confirming ? (
            <span className="inline-flex items-center gap-1">
              <button
                type="button"
                onClick={onRemove}
                className="rounded-full border border-accent px-2.5 py-1 font-mono text-[0.62rem] uppercase tracking-[0.12em] text-accent"
              >
                Delete?
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="font-mono text-[0.62rem] uppercase tracking-[0.12em] text-faint hover:text-ink"
              >
                Keep
              </button>
            </span>
          ) : (
            <button
              type="button"
              aria-label="Delete entry"
              onClick={() => setConfirming(true)}
              className="ml-auto font-mono text-[0.62rem] uppercase tracking-[0.12em] text-faint transition-colors hover:text-accent"
            >
              ✕
            </button>
          )}
        </div>

        {noteOpen && (
          <div className="mt-1">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              maxLength={2000}
              placeholder="A quick thought…"
              className="w-full resize-y rounded-sm border border-rule bg-paper p-2 font-body text-sm text-ink outline-none focus:border-accent"
            />
            <div className="mt-1 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setNote(entry.note ?? "");
                  setNoteOpen(false);
                }}
                className="font-mono text-[0.62rem] uppercase tracking-[0.12em] text-faint hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdate({ note: note.trim() || null });
                  setNoteOpen(false);
                }}
                className="rounded-full bg-accent px-3 py-1 font-mono text-[0.62rem] uppercase tracking-[0.12em] text-accent-ink"
              >
                Save
              </button>
            </div>
          </div>
        )}

        {!noteOpen && entry.note && (
          <p className="border-l-2 border-rule pl-2 font-body text-sm italic leading-snug text-muted">
            {entry.note}
          </p>
        )}
      </div>
    </article>
  );
}

/**
 * TV episode progress: a bar + −/＋ steppers. Marking the last episode auto-flips
 * the entry to "watched" (handled server-side). Shows raw count when TMDB has no
 * episode total.
 */
function EpisodeProgress({
  watched,
  total,
  seasons,
  onSet,
}: {
  watched: number;
  total: number | null;
  seasons: number | null;
  onSet: (n: number) => void;
}) {
  const pct = total && total > 0 ? Math.min(100, Math.round((watched / total) * 100)) : 0;
  const dec = () => onSet(Math.max(0, watched - 1));
  const inc = () => onSet(watched + 1);
  const atMax = total != null && total > 0 && watched >= total;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between font-mono text-[0.62rem] uppercase tracking-[0.12em] text-muted">
        <span>
          Ep {watched}
          {total ? ` / ${total}` : ""}
          {seasons ? ` · ${seasons} season${seasons === 1 ? "" : "s"}` : ""}
        </span>
        <span className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label="One fewer episode"
            onClick={dec}
            disabled={watched <= 0}
            className="flex h-6 w-6 items-center justify-center rounded-full border border-rule text-ink transition-colors hover:border-accent hover:text-accent disabled:opacity-40"
          >
            −
          </button>
          <button
            type="button"
            aria-label="One more episode"
            onClick={inc}
            disabled={atMax}
            className="flex h-6 items-center gap-1 rounded-full border border-accent bg-accent px-2.5 text-accent-ink transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            ＋1 ep
          </button>
        </span>
      </div>
      {total != null && total > 0 && (
        <span className="relative block h-2 overflow-hidden rounded-full bg-paper">
          <span
            className="absolute inset-y-0 left-0 rounded-full bg-accent-2 transition-[width] duration-300"
            style={{ width: `${pct}%` }}
          />
        </span>
      )}
    </div>
  );
}

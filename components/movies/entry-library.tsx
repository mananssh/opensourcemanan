"use client";

import { useMemo, useState } from "react";
import type { TmdbResult } from "@/lib/movies/tmdb";
import type { MovieCard, WatchStatusValue } from "@/lib/movies/queries";
import { computeStats } from "@/lib/movies/stats";
import { posterUrl } from "@/lib/movies/images";
import { addEntry, updateEntry, deleteEntry, type UpdateEntryInput } from "@/app/movies/actions";
import { QuickAdd } from "@/components/movies/quick-add";
import { EntryCard } from "@/components/movies/entry-card";
import { StatsPanel } from "@/components/movies/stats-panel";

type Filter = "all" | WatchStatusValue;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "watched", label: "Watched" },
  { key: "watching", label: "Watching" },
  { key: "watchlist", label: "Watchlist" },
];

/**
 * The owner's interactive tracker: quick-add, live stats, filterable grid. Holds
 * the entry list as local state so add/rate/delete feel instant; the server
 * actions are authoritative and reconcile the optimistic rows. Stats recompute
 * client-side from the live list, so no round-trip is needed to stay in sync.
 */
export function EntryLibrary({ initialEntries }: { initialEntries: MovieCard[] }) {
  const [entries, setEntries] = useState<MovieCard[]>(initialEntries);
  const [filter, setFilter] = useState<Filter>("all");
  const [addingId, setAddingId] = useState<number | null>(null);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());

  const stats = useMemo(
    () => computeStats(entries.filter((e) => e.status !== "watchlist")),
    [entries],
  );

  const visible = useMemo(
    () => (filter === "all" ? entries : entries.filter((e) => e.status === filter)),
    [entries, filter],
  );

  const setBusy = (id: string, on: boolean) =>
    setBusyIds((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  function upsert(card: MovieCard, dropId?: string) {
    setEntries((prev) => {
      const without = prev.filter(
        (e) =>
          e.id !== card.id &&
          e.id !== dropId &&
          !(e.tmdbId === card.tmdbId && e.mediaType === card.mediaType && e.id !== card.id),
      );
      return [card, ...without];
    });
  }

  async function handleAdd(result: TmdbResult, status: WatchStatusValue) {
    const existing = entries.find(
      (e) => e.tmdbId === result.tmdbId && e.mediaType === result.mediaType,
    );
    if (existing) {
      // Already logged — just surface it (and update status if queued→watched).
      setFilter("all");
    }
    const tempId = `temp-${result.mediaType}-${result.tmdbId}`;
    const temp: MovieCard = {
      id: tempId,
      tmdbId: result.tmdbId,
      mediaType: result.mediaType,
      title: result.title,
      posterUrl: posterUrl(result.posterPath),
      releaseYear: result.releaseYear,
      runtimeMinutes: null,
      genres: [],
      status,
      rating: null,
      watchedOn: status === "watchlist" ? null : new Date().toISOString().slice(0, 10),
      note: null,
      favorite: false,
      rewatches: 0,
      createdAt: new Date().toISOString(),
    };
    setAddingId(result.tmdbId);
    setEntries((prev) => [temp, ...prev.filter((e) => e.id !== existing?.id)]);
    try {
      const res = await addEntry({
        tmdbId: result.tmdbId,
        mediaType: result.mediaType,
        title: result.title,
        posterPath: result.posterPath,
        releaseYear: result.releaseYear,
        status,
      });
      if (res.ok) upsert(res.card, tempId);
      else setEntries((prev) => prev.filter((e) => e.id !== tempId));
    } catch {
      setEntries((prev) => prev.filter((e) => e.id !== tempId));
    } finally {
      setAddingId(null);
    }
  }

  async function handleUpdate(id: string, patch: Omit<UpdateEntryInput, "id">) {
    const prevEntry = entries.find((e) => e.id === id);
    if (!prevEntry || id.startsWith("temp-")) return;
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
    setBusy(id, true);
    try {
      const res = await updateEntry({ id, ...patch });
      if (!res.ok) setEntries((prev) => prev.map((e) => (e.id === id ? prevEntry : e)));
    } catch {
      setEntries((prev) => prev.map((e) => (e.id === id ? prevEntry : e)));
    } finally {
      setBusy(id, false);
    }
  }

  async function handleRemove(id: string) {
    if (id.startsWith("temp-")) return;
    const prevEntries = entries;
    setEntries((prev) => prev.filter((e) => e.id !== id));
    try {
      await deleteEntry({ id });
    } catch {
      setEntries(prevEntries);
    }
  }

  return (
    <div className="space-y-10">
      <QuickAdd onPick={handleAdd} busyId={addingId} />

      <StatsPanel stats={stats} />

      <div>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {FILTERS.map((f) => {
            const count =
              f.key === "all"
                ? entries.length
                : entries.filter((e) => e.status === f.key).length;
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[0.62rem] uppercase tracking-[0.14em] transition-colors ${
                  active
                    ? "border-accent bg-accent text-accent-ink"
                    : "border-rule text-muted hover:border-accent hover:text-accent"
                }`}
              >
                {f.label}
                <span className={active ? "opacity-80" : "text-faint"}>{count}</span>
              </button>
            );
          })}
        </div>

        {visible.length === 0 ? (
          <p className="rounded-sm border border-dashed border-rule bg-surface px-4 py-10 text-center font-body text-muted">
            {entries.length === 0
              ? "Nothing logged yet. Search a title above to start your reel."
              : "Nothing in this list."}
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {visible.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                busy={busyIds.has(entry.id) || entry.id.startsWith("temp-")}
                onUpdate={(patch) => handleUpdate(entry.id, patch)}
                onRemove={() => handleRemove(entry.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { type ReactNode, useMemo, useState } from "react";
import Fuse, { type FuseResultMatch } from "fuse.js";
import { VAULT_CATEGORIES, categoryLabel } from "@/lib/vault/categories";
import type { VaultDocCard } from "@/lib/vault/queries";
import { UploadDropzone } from "@/components/vault/upload-dropzone";
import { DocumentCard } from "@/components/vault/document-card";
import { EditDialog } from "@/components/vault/edit-dialog";
import { SearchIcon, CloseIcon } from "@/components/vault/icons";

/** Wrap the fuzzy-matched ranges of `text` in a highlight, per Fuse indices. */
function highlight(text: string, matches?: readonly FuseResultMatch[]): ReactNode {
  const m = matches?.find((x) => x.key === "title");
  if (!m || !m.indices.length) return text;
  const out: ReactNode[] = [];
  let last = 0;
  // Fuse indices can overlap/adjoin; merge as we walk left to right.
  const ranges = [...m.indices].sort((a, b) => a[0] - b[0]);
  for (const [start, end] of ranges) {
    if (start > last) out.push(text.slice(last, start));
    out.push(
      <mark
        key={start}
        className="rounded-[3px] bg-accent-soft px-0.5 text-accent"
      >
        {text.slice(start, end + 1)}
      </mark>,
    );
    last = end + 1;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function VaultConsole({
  cards,
  configured,
}: {
  cards: VaultDocCard[];
  configured: boolean;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [editing, setEditing] = useState<VaultDocCard | null>(null);

  const fuse = useMemo(
    () =>
      new Fuse(cards, {
        keys: [
          { name: "title", weight: 0.5 },
          { name: "tags", weight: 0.2 },
          { name: "notes", weight: 0.15 },
          { name: "originalFilename", weight: 0.15 },
        ],
        includeMatches: true,
        threshold: 0.4,
        ignoreLocation: true,
        minMatchCharLength: 2,
      }),
    [cards],
  );

  // Fuzzy-rank on query; otherwise keep server order (newest first).
  const results = useMemo(() => {
    const q = query.trim();
    const ranked = q
      ? fuse.search(q).map((r) => ({ card: r.item, matches: r.matches }))
      : cards.map((card) => ({ card, matches: undefined }));
    return category ? ranked.filter((r) => r.card.category === category) : ranked;
  }, [query, category, fuse, cards]);

  // Category chips only show categories that actually have documents.
  const present = useMemo(() => {
    const set = new Set(cards.map((c) => c.category));
    return VAULT_CATEGORIES.filter((c) => set.has(c.value));
  }, [cards]);

  return (
    <div className="mt-8">
      <UploadDropzone configured={configured} />

      {/* Search + filters */}
      <div className="mt-8">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-lg text-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search titles, tags, notes, filenames…"
            aria-label="Search documents"
            className="w-full rounded-xl border border-rule bg-surface py-3 pl-11 pr-10 text-ink outline-none placeholder:text-faint focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-faint hover:text-ink focus-visible:ring-2 focus-visible:ring-accent"
              aria-label="Clear search"
            >
              <CloseIcon className="text-base" />
            </button>
          )}
        </div>

        {present.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Chip
              active={category === null}
              onClick={() => setCategory(null)}
              label={`All · ${cards.length}`}
            />
            {present.map((c) => (
              <Chip
                key={c.value}
                active={category === c.value}
                onClick={() =>
                  setCategory(category === c.value ? null : c.value)
                }
                label={c.label}
              />
            ))}
          </div>
        )}
      </div>

      {/* Results */}
      {results.length === 0 ? (
        <p className="mt-10 text-center font-mono text-sm text-faint">
          {cards.length === 0
            ? "No documents yet. Upload your first above."
            : `No matches${query ? ` for "${query}"` : ""}${
                category ? ` in ${categoryLabel(category)}` : ""
              }.`}
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map(({ card, matches }) => (
            <DocumentCard
              key={card.id}
              doc={card}
              title={highlight(card.title, matches)}
              onEdit={() => setEditing(card)}
            />
          ))}
        </div>
      )}

      {editing && (
        <EditDialog doc={editing} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}

function Chip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3 py-1 font-mono text-[0.62rem] uppercase tracking-[0.1em] transition-colors focus-visible:ring-2 focus-visible:ring-accent ${
        active
          ? "border-accent bg-accent text-accent-ink"
          : "border-rule text-muted hover:border-accent/60 hover:text-ink"
      }`}
    >
      {label}
    </button>
  );
}

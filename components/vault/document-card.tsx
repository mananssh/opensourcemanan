"use client";

import { type ReactNode, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteDocument, toggleFavorite } from "@/app/vault/actions";
import { categoryLabel } from "@/lib/vault/categories";
import { formatBytes, formatDate } from "@/lib/vault/format";
import type { VaultDocCard } from "@/lib/vault/queries";
import {
  DownloadIcon,
  FileIcon,
  PencilIcon,
  StarIcon,
  TrashIcon,
} from "@/components/vault/icons";

/** One sealed dossier. `title` may be a highlighted node from fuzzy search. */
export function DocumentCard({
  doc,
  title,
  onEdit,
}: {
  doc: VaultDocCard;
  title: ReactNode;
  onEdit: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  function fav() {
    startTransition(async () => {
      await toggleFavorite(doc.id, !doc.favorite);
      router.refresh();
    });
  }

  function remove() {
    startTransition(async () => {
      await deleteDocument(doc.id);
      router.refresh();
    });
  }

  const ext = doc.originalFilename.split(".").pop()?.toUpperCase().slice(0, 4);

  return (
    <div className="group relative flex flex-col gap-3 rounded-xl border border-rule bg-surface p-4 transition-all hover:border-accent/60 hover:shadow-[0_2px_20px_-8px_var(--accent)]">
      {/* Top row: seal + code, favorite */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg border border-rule bg-paper text-accent">
            <FileIcon className="text-lg" />
          </span>
          <span className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-faint">
            {ext || "FILE"} · {formatBytes(doc.sizeBytes)}
          </span>
        </div>
        <button
          type="button"
          onClick={fav}
          disabled={pending}
          aria-pressed={doc.favorite}
          aria-label={doc.favorite ? "Unfavorite" : "Favorite"}
          className={`rounded-md p-1 transition-colors focus-visible:ring-2 focus-visible:ring-accent ${
            doc.favorite ? "text-accent" : "text-faint hover:text-accent"
          }`}
        >
          <StarIcon
            className="text-lg"
            fill={doc.favorite ? "currentColor" : "none"}
          />
        </button>
      </div>

      {/* Title */}
      <h3 className="font-display text-lg font-semibold leading-snug text-ink">
        {title}
      </h3>

      {/* Category + tags */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="rounded-full border border-accent/40 bg-accent-soft px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-[0.12em] text-accent">
          {categoryLabel(doc.category)}
        </span>
        {doc.tags.map((t) => (
          <span
            key={t}
            className="rounded-full border border-rule px-2 py-0.5 font-mono text-[0.6rem] text-muted"
          >
            {t}
          </span>
        ))}
      </div>

      {doc.notes && (
        <p className="line-clamp-2 text-sm leading-relaxed text-muted">
          {doc.notes}
        </p>
      )}

      {/* Footer: date + actions */}
      <div className="mt-auto flex items-center justify-between gap-2 border-t border-rule pt-3">
        <span className="font-mono text-[0.6rem] text-faint">
          {formatDate(doc.createdAt)}
        </span>
        <div className="flex items-center gap-1">
          {confirming ? (
            <>
              <button
                type="button"
                onClick={remove}
                disabled={pending}
                className="rounded-md px-2 py-1 font-mono text-[0.62rem] uppercase tracking-wide text-negative hover:bg-negative/10 focus-visible:ring-2 focus-visible:ring-negative"
              >
                {pending ? "Deleting…" : "Confirm"}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="rounded-md px-2 py-1 font-mono text-[0.62rem] uppercase tracking-wide text-muted hover:text-ink"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <a
                href={`/api/vault/${doc.id}/download`}
                className="rounded-md p-1.5 text-muted transition-colors hover:bg-paper hover:text-accent focus-visible:ring-2 focus-visible:ring-accent"
                aria-label={`Download ${doc.title}`}
              >
                <DownloadIcon className="text-base" />
              </a>
              <button
                type="button"
                onClick={onEdit}
                className="rounded-md p-1.5 text-muted transition-colors hover:bg-paper hover:text-ink focus-visible:ring-2 focus-visible:ring-accent"
                aria-label={`Edit ${doc.title}`}
              >
                <PencilIcon className="text-base" />
              </button>
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="rounded-md p-1.5 text-muted transition-colors hover:bg-paper hover:text-negative focus-visible:ring-2 focus-visible:ring-negative"
                aria-label={`Delete ${doc.title}`}
              >
                <TrashIcon className="text-base" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

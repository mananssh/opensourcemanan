"use client";

import { type ReactNode, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useReducedMotion, motion } from "motion/react";
import { deleteDocument, toggleFavorite } from "@/app/vault/actions";
import { categoryDisplayLabel } from "@/lib/vault/categories";
import { formatBytes, formatDate } from "@/lib/vault/format";
import type { VaultDocCard } from "@/lib/vault/queries";
import {
  DownloadIcon,
  PencilIcon,
  StarIcon,
  TrashIcon,
} from "@/components/vault/icons";

/** One sealed dossier row. `title` may be a highlighted node from fuzzy search. */
export function DocumentCard({
  doc,
  title,
  onEdit,
  index = 0,
}: {
  doc: VaultDocCard;
  title: ReactNode;
  onEdit: () => void;
  index?: number;
}) {
  const router = useRouter();
  const reduce = useReducedMotion();
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
    <motion.li
      initial={reduce ? false : { opacity: 0, x: -10 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{
        duration: 0.35,
        delay: reduce ? 0 : Math.min(index, 8) * 0.04,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="group list-none"
    >
      <div className="flex flex-col gap-4 py-5 transition-colors sm:flex-row sm:items-start sm:justify-between sm:gap-8">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-[0.6rem] tracking-[0.16em] text-faint">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-accent-2">
              {ext || "FILE"} · {formatBytes(doc.sizeBytes)}
            </span>
            {doc.categories.map((cat) => (
              <span
                key={cat}
                className="border border-accent/35 bg-accent-soft px-2 py-0.5 font-mono text-[0.58rem] uppercase tracking-[0.12em] text-accent"
              >
                {categoryDisplayLabel(cat, doc.categoryOther)}
              </span>
            ))}
          </div>

          <h3 className="vault-wordmark mt-2 font-display text-xl font-semibold tracking-wide text-ink transition-colors group-hover:text-accent sm:text-2xl">
            {title}
          </h3>

          {doc.tags.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {doc.tags.map((t) => (
                <span
                  key={t}
                  className="border border-rule px-2 py-0.5 font-mono text-[0.58rem] text-muted"
                >
                  {t}
                </span>
              ))}
            </div>
          ) : null}

          {doc.notes ? (
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">
              {doc.notes}
            </p>
          ) : null}

          <p className="mt-3 font-mono text-[0.58rem] text-faint">
            {formatDate(doc.createdAt)}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1 self-start">
          <button
            type="button"
            onClick={fav}
            disabled={pending}
            aria-pressed={doc.favorite}
            aria-label={doc.favorite ? "Unfavorite" : "Favorite"}
            className={`p-2 transition-colors focus-visible:ring-2 focus-visible:ring-accent ${
              doc.favorite ? "text-accent" : "text-faint hover:text-accent-2"
            }`}
          >
            <StarIcon
              className="text-lg"
              fill={doc.favorite ? "currentColor" : "none"}
            />
          </button>

          {confirming ? (
            <>
              <button
                type="button"
                onClick={remove}
                disabled={pending}
                className="px-2 py-1 font-mono text-[0.62rem] uppercase tracking-wide text-negative hover:bg-negative/10 focus-visible:ring-2 focus-visible:ring-negative"
              >
                {pending ? "Deleting…" : "Confirm"}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="px-2 py-1 font-mono text-[0.62rem] uppercase tracking-wide text-muted hover:text-ink"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <a
                href={`/api/vault/${doc.id}/download`}
                className="p-2 text-muted transition-colors hover:text-accent focus-visible:ring-2 focus-visible:ring-accent"
                aria-label={`Download ${doc.title}`}
              >
                <DownloadIcon className="text-base" />
              </a>
              <button
                type="button"
                onClick={onEdit}
                className="p-2 text-muted transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-accent"
                aria-label={`Edit ${doc.title}`}
              >
                <PencilIcon className="text-base" />
              </button>
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="p-2 text-muted transition-colors hover:text-negative focus-visible:ring-2 focus-visible:ring-negative"
                aria-label={`Delete ${doc.title}`}
              >
                <TrashIcon className="text-base" />
              </button>
            </>
          )}
        </div>
      </div>
    </motion.li>
  );
}

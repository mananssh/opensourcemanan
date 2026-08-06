"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateDocument } from "@/app/vault/actions";
import { VAULT_CATEGORIES } from "@/lib/vault/categories";
import type { VaultDocCard } from "@/lib/vault/queries";
import { CloseIcon } from "@/components/vault/icons";

/** Modal to edit a document's searchable metadata. Bytes are never touched. */
export function EditDialog({
  doc,
  onClose,
}: {
  doc: VaultDocCard;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState(doc.title);
  const [category, setCategory] = useState(doc.category);
  const [tags, setTags] = useState(doc.tags.join(", "));
  const [notes, setNotes] = useState(doc.notes ?? "");
  const closeRef = useRef<HTMLButtonElement>(null);

  // Focus the close button on open; close on Escape.
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function save() {
    setError(null);
    startTransition(async () => {
      const res = await updateDocument(doc.id, {
        title,
        category,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        notes,
      });
      if (res.ok) {
        router.refresh();
        onClose();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-paper/70 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={`Edit ${doc.title}`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-2xl border border-rule bg-surface p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-display text-xl font-semibold text-ink">Edit document</h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-paper hover:text-ink focus-visible:ring-2 focus-visible:ring-accent"
            aria-label="Close"
          >
            <CloseIcon className="text-lg" />
          </button>
        </div>

        <p className="mt-1 font-mono text-[0.7rem] text-faint">
          {doc.originalFilename}
        </p>

        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-faint">
              Title
            </span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              className="mt-1.5 w-full rounded-lg border border-rule bg-paper px-3 py-2 text-ink outline-none focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent"
            />
          </label>

          <label className="block">
            <span className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-faint">
              Category
            </span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as typeof category)}
              className="mt-1.5 w-full rounded-lg border border-rule bg-paper px-3 py-2 text-ink outline-none focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent"
            >
              {VAULT_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-faint">
              Tags <span className="normal-case">(comma-separated)</span>
            </span>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. renewed-2027, original"
              className="mt-1.5 w-full rounded-lg border border-rule bg-paper px-3 py-2 text-ink outline-none placeholder:text-faint focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent"
            />
          </label>

          <label className="block">
            <span className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-faint">
              Notes
            </span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              maxLength={2000}
              className="mt-1.5 w-full resize-none rounded-lg border border-rule bg-paper px-3 py-2 text-ink outline-none placeholder:text-faint focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent"
            />
          </label>
        </div>

        {error && (
          <p className="mt-3 text-sm text-negative" role="alert">
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-muted transition-colors hover:text-ink"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-ink transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

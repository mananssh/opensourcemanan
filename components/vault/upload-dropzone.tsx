"use client";

import { useRef, useState, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import { VAULT_CATEGORIES } from "@/lib/vault/categories";
import { formatBytes } from "@/lib/vault/format";
import { UploadIcon, CloseIcon, LockIcon } from "@/components/vault/icons";

const MAX_BYTES = 25 * 1024 * 1024;

/** Drag-drop / picker that encrypts on the server before anything hits storage. */
export function UploadDropzone({ configured }: { configured: boolean }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>("identity");
  const [tags, setTags] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function pick(f: File | null) {
    setError(null);
    if (!f) return;
    if (f.size > MAX_BYTES) {
      setError(`"${f.name}" is larger than the 25 MB limit.`);
      return;
    }
    setFile(f);
    setTitle(f.name.replace(/\.[^.]+$/, ""));
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragOver(false);
    pick(e.dataTransfer.files?.[0] ?? null);
  }

  function reset() {
    setFile(null);
    setTitle("");
    setTags("");
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function upload() {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const body = new FormData();
      body.set("file", file);
      body.set("title", title);
      body.set("category", category);
      body.set("tags", tags);
      const res = await fetch("/api/vault/upload", { method: "POST", body });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Upload failed. Try again.");
        return;
      }
      reset();
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setUploading(false);
    }
  }

  if (!configured) {
    return (
      <div className="border border-dashed border-rule bg-surface p-6 text-center">
        <LockIcon className="mx-auto text-2xl text-faint" />
        <p className="mt-2 text-sm text-muted">
          Sealing is disabled until{" "}
          <code className="font-mono text-accent">VAULT_MASTER_KEY</code> is set.
          Add it to your environment to enable encrypted storage.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-rule bg-surface p-4">
      {!file ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`flex w-full flex-col items-center gap-3 border border-dashed px-6 py-12 text-center transition-colors focus-visible:ring-2 focus-visible:ring-accent ${
            dragOver
              ? "border-accent bg-accent-soft"
              : "border-rule hover:border-accent/60"
          }`}
        >
          <UploadIcon className="text-3xl text-accent" />
          <span className="font-display text-lg font-semibold tracking-wide text-ink">
            Drop to seal, or click to choose
          </span>
          <span className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-faint">
            Encrypted on upload · PDF, images, office · max 25 MB
          </span>
        </button>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 border border-rule bg-paper px-3 py-2">
            <span className="truncate font-mono text-xs text-muted">
              {file.name}{" "}
              <span className="text-faint">· {formatBytes(file.size)}</span>
            </span>
            <button
              type="button"
              onClick={reset}
              className="p-1 text-faint hover:text-ink focus-visible:ring-2 focus-visible:ring-accent"
              aria-label="Remove file"
            >
              <CloseIcon className="text-base" />
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-faint">
                Title
              </span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                className="mt-1 w-full border border-rule bg-paper px-3 py-2 text-ink outline-none focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent"
              />
            </label>
            <label className="block">
              <span className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-faint">
                Category
              </span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 w-full border border-rule bg-paper px-3 py-2 text-ink outline-none focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent"
              >
                {VAULT_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-faint">
                Tags
              </span>
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="comma-separated"
                className="mt-1 w-full border border-rule bg-paper px-3 py-2 text-ink outline-none placeholder:text-faint focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent"
              />
            </label>
          </div>

          {error ? (
            <p className="text-sm text-negative" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={reset}
              className="text-sm text-muted transition-colors hover:text-ink"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={upload}
              disabled={uploading || !title.trim()}
              className="inline-flex items-center gap-2 border border-accent bg-accent px-4 py-2 font-mono text-[0.7rem] uppercase tracking-[0.14em] text-accent-ink transition-colors hover:bg-transparent hover:text-accent focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
            >
              <LockIcon className="text-base" />
              {uploading ? "Sealing…" : "Seal & store"}
            </button>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(e) => pick(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}

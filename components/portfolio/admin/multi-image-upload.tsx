"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ACCEPT = "image/png,image/jpeg,image/gif,image/webp,image/avif";

type Item = { key: string; url: string };

/**
 * Multi-image gallery uploader for the portfolio admin. Uploads each file to GCS
 * via a presigned URL and stores the ordered list of object keys as a JSON array
 * in a hidden field (the save action publishes them + cleans up removed ones).
 * Initial previews are passed in from the server (publicUrl can't be imported
 * client-side — it pulls the GCS SDK).
 */
export function MultiImageUpload({
  name,
  vertical = "portfolio",
  initial = [],
}: {
  name: string;
  vertical?: "blog" | "dump" | "portfolio" | "projects" | "misc";
  initial?: Item[];
}) {
  const [items, setItems] = useState<Item[]>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const hiddenRef = useRef<HTMLInputElement>(null);

  // Restore initial set when the surrounding form resets.
  useEffect(() => {
    const form = hiddenRef.current?.form;
    if (!form) return;
    const onReset = () => {
      setItems(initial);
      setError("");
    };
    form.addEventListener("reset", onReset);
    return () => form.removeEventListener("reset", onReset);
  }, [initial]);

  async function onFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    setBusy(true);
    setError("");
    try {
      for (const file of files) {
        if (file.size > MAX_BYTES) {
          setError("Each image must be under 10 MB.");
          continue;
        }
        const res = await fetch("/api/storage/upload-url", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            vertical,
            filename: file.name,
            contentType: file.type || "image/jpeg",
          }),
        });
        if (!res.ok) throw new Error("Could not get an upload URL.");
        const { url, key } = (await res.json()) as { url: string; key: string };
        const put = await fetch(url, {
          method: "PUT",
          headers: { "Content-Type": file.type || "image/jpeg" },
          body: file,
        });
        if (!put.ok) throw new Error("Upload failed.");
        setItems((prev) => [...prev, { key, url: URL.createObjectURL(file) }]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload error.");
    } finally {
      setBusy(false);
    }
  }

  function remove(key: string) {
    setItems((prev) => prev.filter((i) => i.key !== key));
  }

  return (
    <div className="space-y-2">
      <input
        ref={hiddenRef}
        type="hidden"
        name={name}
        value={JSON.stringify(items.map((i) => i.key))}
      />
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {items.map((it) => (
            <div key={it.key} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={it.url}
                alt=""
                className="h-20 w-20 rounded-md border border-rule object-cover"
              />
              <button
                type="button"
                onClick={() => remove(it.key)}
                aria-label="Remove image"
                className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full border border-rule bg-surface text-xs text-ink transition-colors hover:border-accent hover:text-accent"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      <input
        type="file"
        accept={ACCEPT}
        multiple
        onChange={onFiles}
        disabled={busy}
        className="block w-full font-mono text-xs text-muted file:mr-3 file:rounded-full file:border file:border-rule file:bg-surface file:px-3 file:py-1.5 file:font-mono file:text-xs file:text-ink hover:file:border-accent"
      />
      {busy && <p className="font-mono text-xs text-faint">Uploading…</p>}
      {error && <p className="font-mono text-xs text-accent">{error}</p>}
    </div>
  );
}

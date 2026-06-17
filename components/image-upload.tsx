"use client";

import { useState, type ChangeEvent } from "react";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ACCEPT = "image/png,image/jpeg,image/gif,image/webp,image/avif";

/**
 * Owner image picker: uploads straight to GCS via a presigned URL, then writes
 * the object key into a hidden form field. The save action makes it public.
 */
export function ImageUpload({
  name,
  initialKey,
  initialUrl,
  vertical = "blog",
}: {
  name: string;
  initialKey?: string | null;
  initialUrl?: string | null;
  vertical?: "blog" | "projects" | "misc";
}) {
  const [key, setKey] = useState(initialKey ?? "");
  const [preview, setPreview] = useState(initialUrl ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setError("Image is too large (max 10 MB).");
      e.target.value = "";
      return;
    }
    setBusy(true);
    setError("");
    try {
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
      const { url, key: newKey } = (await res.json()) as { url: string; key: string };
      const put = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": file.type || "image/jpeg" },
        body: file,
      });
      if (!put.ok) throw new Error("Upload failed.");
      setKey(newKey);
      setPreview(URL.createObjectURL(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={key} />
      {preview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt=""
          className="h-28 w-44 rounded-md border border-rule object-cover"
        />
      )}
      <input
        type="file"
        accept={ACCEPT}
        onChange={onFile}
        disabled={busy}
        className="block w-full font-mono text-xs text-muted file:mr-3 file:rounded-full file:border file:border-rule file:bg-surface file:px-3 file:py-1.5 file:font-mono file:text-xs file:text-ink hover:file:border-accent"
      />
      {busy && <p className="font-mono text-xs text-faint">Uploading…</p>}
      {error && <p className="font-mono text-xs text-accent">{error}</p>}
      {key && !busy && (
        <p className="truncate font-mono text-[0.7rem] text-faint">{key}</p>
      )}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ACCEPT = "image/png,image/jpeg,image/gif,image/webp,image/avif";

/**
 * Owner image picker: uploads straight to R2 via a presigned URL, then writes
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
  vertical?: "blog" | "dump" | "portfolio" | "projects" | "misc";
}) {
  const [key, setKey] = useState(initialKey ?? "");
  const [preview, setPreview] = useState(initialUrl ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const hiddenRef = useRef<HTMLInputElement>(null);

  // Clear the key/preview when the surrounding form resets (e.g. after a
  // successful post) — form.reset() only clears native fields, not this React
  // state, which is why the image preview lingered after posting.
  useEffect(() => {
    const form = hiddenRef.current?.form;
    if (!form) return;
    const onReset = () => {
      setKey(initialKey ?? "");
      setPreview(initialUrl ?? "");
      setError("");
    };
    form.addEventListener("reset", onReset);
    return () => form.removeEventListener("reset", onReset);
  }, [initialKey, initialUrl]);

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
      // If we're replacing a file uploaded earlier THIS session (not the
      // originally-saved one), clean it up so it doesn't linger unreferenced.
      if (key && key !== initialKey) {
        fetch("/api/storage/object", {
          method: "DELETE",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ key }),
        }).catch(() => {});
      }
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
      <input ref={hiddenRef} type="hidden" name={name} value={key} />
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

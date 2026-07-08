"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Owner résumé picker — same presigned-upload flow as ImageUpload, but for a
 * single PDF. Stores the object key (never a raw URL) into a hidden field.
 */
export function ResumeUpload({
  name,
  initialKey,
  initialUrl,
}: {
  name: string;
  initialKey?: string | null;
  initialUrl?: string | null;
}) {
  const [key, setKey] = useState(initialKey ?? "");
  const [url, setUrl] = useState(initialUrl ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const hiddenRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const form = hiddenRef.current?.form;
    if (!form) return;
    const onReset = () => {
      setKey(initialKey ?? "");
      setUrl(initialUrl ?? "");
      setError("");
    };
    form.addEventListener("reset", onReset);
    return () => form.removeEventListener("reset", onReset);
  }, [initialKey, initialUrl]);

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      setError("Résumé must be a PDF.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("File is too large (max 10 MB).");
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
          vertical: "portfolio",
          filename: file.name,
          contentType: file.type,
        }),
      });
      if (!res.ok) throw new Error("Could not get an upload URL.");
      const { url: putUrl, key: newKey } = (await res.json()) as { url: string; key: string };
      const put = await fetch(putUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
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
      setUrl(URL.createObjectURL(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <input ref={hiddenRef} type="hidden" name={name} value={key} />
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="block truncate font-mono text-xs text-accent underline underline-offset-2"
        >
          View current résumé
        </a>
      )}
      <input
        type="file"
        accept="application/pdf"
        onChange={onFile}
        disabled={busy}
        className="block w-full font-mono text-xs text-muted file:mr-3 file:rounded-full file:border file:border-rule file:bg-surface file:px-3 file:py-1.5 file:font-mono file:text-xs file:text-ink hover:file:border-accent"
      />
      {busy && <p className="font-mono text-xs text-faint">Uploading…</p>}
      {error && <p className="font-mono text-xs text-accent">{error}</p>}
      {key && !busy && <p className="truncate font-mono text-[0.7rem] text-faint">{key}</p>}
    </div>
  );
}

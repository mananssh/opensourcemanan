"use client";

import { useEffect, useState } from "react";

interface ShareModalProps {
  /** Shown in the preview — no link, so the matrix stays the focus. */
  displayText: string;
  /** Actually shared/copied — includes the link back to Geetdle. */
  shareText: string;
  onClose: () => void;
}

export function ShareModal({ displayText, shareText, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
    } catch {
      // Fallback for insecure contexts / older browsers
      const ta = document.createElement("textarea");
      ta.value = shareText;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch {
        /* no-op */
      }
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title: "Geetdle", text: shareText });
        return;
      } catch {
        // User cancelled or share failed — fall back to copy
      }
    }
    await handleCopy();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-rule bg-paper p-6 shadow-2xl shadow-black/10 sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          className="mb-5 text-lg font-bold text-ink"
          style={{ fontFamily: "var(--display-family)" }}
        >
          Share your results
        </h2>

        <div className="mb-5 rounded-xl border border-rule bg-surface p-4">
          <pre
            className="whitespace-pre-wrap break-words text-sm text-ink"
            style={{ fontFamily: "var(--mono-family)" }}
          >
            {displayText}
          </pre>
        </div>

        <div className="flex flex-col gap-2.5 sm:flex-row">
          <button
            onClick={handleShare}
            className="flex-1 rounded-full bg-accent px-4 py-3 text-sm font-semibold text-accent-ink transition-all hover:opacity-90 active:scale-[0.98]"
          >
            Share
          </button>
          <button
            onClick={handleCopy}
            className="flex-1 rounded-full border border-rule px-4 py-3 text-sm font-semibold text-ink transition-all hover:bg-surface active:scale-[0.98]"
          >
            {copied ? "✓ Copied" : "Copy"}
          </button>
          <button
            onClick={onClose}
            className="rounded-full px-5 py-3 text-sm font-medium text-muted transition-colors hover:text-ink sm:flex-none"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

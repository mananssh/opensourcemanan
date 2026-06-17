"use client";

import { useState } from "react";

/**
 * Lightweight share controls: copy permalink + share to X. Uses the canonical
 * URL passed from the server so it works regardless of the current host.
 */
export function SharePost({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);

  const btn =
    "inline-flex h-8 items-center gap-1.5 rounded-full border border-rule px-3 font-mono text-[0.7rem] uppercase tracking-[0.12em] text-muted transition-colors hover:border-accent hover:text-accent";

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  const x = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-faint">
        Share
      </span>
      <button type="button" onClick={copy} className={btn} aria-label="Copy link">
        {copied ? "Copied" : "Copy link"}
      </button>
      <a
        href={x}
        target="_blank"
        rel="noopener noreferrer"
        className={btn}
        aria-label="Share on X"
      >
        X
      </a>
    </div>
  );
}

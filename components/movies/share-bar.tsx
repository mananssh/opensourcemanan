"use client";

import { useState } from "react";

/**
 * Share controls for a reel: copy the profile link and open the generated
 * ticket-stub cards (story / square) to save for an Instagram story. The cards
 * are public OG routes, so "open" just navigates to the PNG in a new tab.
 */
export function ShareBar({ handle }: { handle: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/movies/${handle}`
        : `/movies/${handle}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked */
    }
  }

  const link =
    "inline-flex h-9 items-center rounded-full border border-rule px-4 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-muted transition-colors hover:border-accent hover:text-accent";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={copy} className={link}>
        {copied ? "Copied ✓" : "Copy link"}
      </button>
      <a
        href={`/movies/${handle}/share/story`}
        target="_blank"
        rel="noopener noreferrer"
        className={link}
      >
        Story card ↗
      </a>
      <a
        href={`/movies/${handle}/share/square`}
        target="_blank"
        rel="noopener noreferrer"
        className={link}
      >
        Square card ↗
      </a>
    </div>
  );
}

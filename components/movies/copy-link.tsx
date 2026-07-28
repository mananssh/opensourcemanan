"use client";

import { useState } from "react";

/** Copy the current profile URL — the low-effort "share your reel" for MVP. */
export function CopyLink({ handle }: { handle: string }) {
  const [done, setDone] = useState(false);

  async function copy() {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/movies/${handle}`
        : `/movies/${handle}`;
    try {
      await navigator.clipboard.writeText(url);
      setDone(true);
      setTimeout(() => setDone(false), 1800);
    } catch {
      /* clipboard blocked — ignore */
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex h-9 items-center gap-1.5 rounded-full border border-rule px-4 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-muted transition-colors hover:border-accent hover:text-accent"
    >
      {done ? "Copied ✓" : "Share reel"}
    </button>
  );
}

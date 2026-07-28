"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { normalizeHandle } from "@/lib/movies/handle";

/**
 * Find a friend by their EXACT @handle and jump to their reel. No fuzzy search,
 * no directory — matching Reel's "not social media" stance. Follow happens from
 * their profile.
 */
export function FindFriend() {
  const [value, setValue] = useState("");
  const router = useRouter();

  function go(e: React.FormEvent) {
    e.preventDefault();
    const handle = normalizeHandle(value);
    if (handle) router.push(`/movies/${handle}`);
  }

  return (
    <form onSubmit={go} className="flex items-center gap-2">
      <div className="flex flex-1 items-center rounded-full border border-rule bg-surface px-3 py-1.5 focus-within:border-accent">
        <span className="font-mono text-sm text-faint">@</span>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="find a friend by handle"
          autoComplete="off"
          spellCheck={false}
          className="w-full bg-transparent pl-1 font-mono text-sm text-ink outline-none placeholder:text-faint"
        />
      </div>
      <button
        type="submit"
        className="inline-flex h-8 items-center rounded-full border border-rule px-3 font-mono text-[0.6rem] uppercase tracking-[0.14em] text-muted transition-colors hover:border-accent hover:text-accent"
      >
        Go →
      </button>
    </form>
  );
}

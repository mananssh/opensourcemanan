"use client";

import { useActionState, useState } from "react";
import { SubmitButton } from "@/components/blog/submit-button";
import { claimHandle } from "@/app/movies/actions";
import { normalizeHandle } from "@/lib/movies/handle";

/** Onboarding: pick a unique @handle. Live-normalizes the preview as you type. */
export function HandleForm() {
  const [state, action] = useActionState(claimHandle, {});
  const [raw, setRaw] = useState("");
  const preview = normalizeHandle(raw);

  return (
    <form action={action} className="mt-8 max-w-md">
      <label
        htmlFor="handle"
        className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-faint"
      >
        Your handle
      </label>
      <div className="mt-2 flex items-center rounded-sm border-2 border-ink bg-surface px-3 py-2.5 focus-within:border-accent">
        <span className="font-display text-lg text-accent">@</span>
        <input
          id="handle"
          name="handle"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          autoFocus
          autoComplete="off"
          spellCheck={false}
          placeholder="yourname"
          className="w-full bg-transparent pl-1 font-display text-lg text-ink outline-none placeholder:text-faint"
        />
      </div>
      <p className="mt-2 font-mono text-[0.62rem] text-faint">
        {preview
          ? `Your reel will live at /movies/${preview}`
          : "3–20 chars: lowercase letters, numbers, underscores."}
      </p>

      {state.error && (
        <p role="alert" className="mt-3 font-mono text-sm text-accent">
          {state.error}
        </p>
      )}

      <SubmitButton
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-2.5 font-mono text-sm uppercase tracking-[0.12em] text-accent-ink transition-opacity hover:opacity-90"
        pendingLabel="Reserving…"
      >
        Claim it →
      </SubmitButton>
    </form>
  );
}

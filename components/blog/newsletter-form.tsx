"use client";

import { useActionState } from "react";
import { subscribe } from "@/app/blog/engagement-actions";

export function NewsletterForm() {
  const [state, action, pending] = useActionState(subscribe, {
    ok: false,
    message: "",
  });

  return (
    <form action={action} className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <input
        name="email"
        type="email"
        required
        placeholder="you@email.com"
        aria-label="Email address"
        className="flex-1 rounded-full border border-rule bg-surface px-4 py-2.5 font-mono text-sm text-ink outline-none transition-colors placeholder:text-faint focus:border-accent"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-accent px-6 py-2.5 font-mono text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "…" : "Subscribe"}
      </button>
      {state.message && (
        <p className={`font-mono text-xs ${state.ok ? "text-accent" : "text-muted"}`}>
          {state.message}
        </p>
      )}
    </form>
  );
}

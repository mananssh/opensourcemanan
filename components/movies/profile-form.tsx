"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/blog/submit-button";
import { saveProfile } from "@/app/movies/actions";
import type { PublicWatcher } from "@/lib/movies/queries";

const fieldClass =
  "mt-2 w-full rounded-sm border border-rule bg-surface px-3 py-2 font-body text-base text-ink outline-none focus:border-accent";
const labelClass =
  "font-mono text-[0.62rem] uppercase tracking-[0.18em] text-faint";

/** Settings: edit display name, bio, and handle. */
export function ProfileForm({ watcher }: { watcher: PublicWatcher }) {
  const [state, action] = useActionState(saveProfile, {});

  return (
    <form action={action} className="mt-8 max-w-md space-y-5">
      <div>
        <label htmlFor="displayName" className={labelClass}>
          Display name
        </label>
        <input
          id="displayName"
          name="displayName"
          defaultValue={watcher.displayName ?? ""}
          maxLength={60}
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor="handle" className={labelClass}>
          Handle
        </label>
        <div className="mt-2 flex items-center rounded-sm border border-rule bg-surface px-3 py-2 focus-within:border-accent">
          <span className="font-display text-accent">@</span>
          <input
            id="handle"
            name="handle"
            defaultValue={watcher.handle}
            spellCheck={false}
            autoComplete="off"
            className="w-full bg-transparent pl-1 font-body text-base text-ink outline-none"
          />
        </div>
      </div>

      <div>
        <label htmlFor="bio" className={labelClass}>
          Bio
        </label>
        <textarea
          id="bio"
          name="bio"
          defaultValue={watcher.bio ?? ""}
          rows={3}
          maxLength={280}
          placeholder="Certified popcorn enjoyer."
          className={`${fieldClass} resize-y`}
        />
      </div>

      {state.error && (
        <p role="alert" className="font-mono text-sm text-accent">
          {state.error}
        </p>
      )}

      <SubmitButton
        className="inline-flex items-center border border-accent bg-accent px-5 py-2 font-mono text-[0.7rem] uppercase tracking-[0.14em] text-accent-ink transition-colors hover:bg-transparent hover:text-accent"
        pendingLabel="Saving…"
      >
        Save
      </SubmitButton>
    </form>
  );
}

"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { createThought, type DumpState } from "@/app/dump/actions";
import { ImageUpload } from "@/components/image-upload";

function PostButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`rounded-md bg-accent px-5 py-2 font-mono text-sm uppercase tracking-[0.1em] text-white transition-opacity hover:opacity-90 ${pending ? "cursor-wait opacity-60" : ""}`}
    >
      {pending ? "Pinning…" : "Pin it up"}
    </button>
  );
}

/** Owner-only inline composer pinned atop the wall. */
export function StickyComposer() {
  const [state, action] = useActionState<DumpState, FormData>(createThought, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={action}
      className="mb-10 rounded-lg border border-rule bg-surface p-5 shadow-sm"
    >
      <textarea
        name="body"
        rows={3}
        maxLength={4000}
        placeholder="What's on your mind?"
        className="w-full resize-y bg-transparent font-body text-2xl leading-snug text-ink placeholder:text-faint focus:outline-none"
      />
      <div className="mt-3 border-t border-rule pt-3">
        <ImageUpload name="imageKey" vertical="dump" />
      </div>
      {state.error && (
        <p role="alert" className="mt-2 font-mono text-xs text-accent">
          {state.error}
        </p>
      )}
      <div className="mt-4 flex items-center justify-between">
        <label className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.1em] text-muted">
          <select
            name="visibility"
            defaultValue="private"
            className="rounded-md border border-rule bg-paper px-2 py-1 text-ink focus:border-accent"
          >
            <option value="private">🔒 Private</option>
            <option value="public">Public</option>
          </select>
        </label>
        <PostButton />
      </div>
    </form>
  );
}

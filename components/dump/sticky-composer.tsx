"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { createThought, editThought, type DumpState } from "@/app/dump/actions";
import { ImageUpload } from "@/components/image-upload";

export interface ComposerInitial {
  id: string;
  body: string;
  imageKey: string | null;
  imageUrl: string | null;
  visibility: "public" | "private";
}

function PostButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`rounded-md bg-accent px-5 py-2 font-mono text-sm uppercase tracking-[0.1em] text-white transition-opacity hover:opacity-90 ${pending ? "cursor-wait opacity-60" : ""}`}
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

/**
 * Owner composer — creates a new thought, or edits an existing one when
 * `initial` is provided (then it submits to editThought, which redirects).
 */
export function StickyComposer({ initial }: { initial?: ComposerInitial }) {
  const editing = Boolean(initial);
  const [state, action] = useActionState<DumpState, FormData>(
    editing ? editThought : createThought,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  // Grow the textarea with its content up to a max, then it scrolls.
  const autosize = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 240)}px`;
  };

  // Size correctly on mount (e.g. edit mode prefilled with a long body).
  useEffect(() => {
    if (taRef.current) autosize(taRef.current);
  }, []);

  useEffect(() => {
    // Only create-mode resets (edit redirects away on success).
    if (state.ok && !editing) {
      formRef.current?.reset();
      if (taRef.current) taRef.current.style.height = "auto"; // back to one line
    }
  }, [state, editing]);

  return (
    <form
      ref={formRef}
      action={action}
      className="mb-10 rounded-lg border border-rule bg-surface p-5 shadow-sm"
    >
      {initial && <input type="hidden" name="id" value={initial.id} />}
      <textarea
        ref={taRef}
        name="body"
        rows={1}
        maxLength={4000}
        defaultValue={initial?.body ?? ""}
        onInput={(e) => autosize(e.currentTarget)}
        placeholder="What's on your mind?"
        className="block max-h-60 w-full resize-none overflow-y-auto bg-transparent font-body text-2xl leading-snug text-ink placeholder:text-faint focus:outline-none"
      />
      <div className="mt-3 border-t border-rule pt-3">
        <ImageUpload
          name="imageKey"
          vertical="dump"
          initialKey={initial?.imageKey}
          initialUrl={initial?.imageUrl}
        />
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
            defaultValue={initial?.visibility ?? "private"}
            className="rounded-md border border-rule bg-paper px-2 py-1 text-ink focus:border-accent"
          >
            <option value="private">🔒 Private</option>
            <option value="public">Public</option>
          </select>
        </label>
        <PostButton
          label={editing ? "Save" : "Pin it up"}
          pendingLabel={editing ? "Saving…" : "Pinning…"}
        />
      </div>
    </form>
  );
}

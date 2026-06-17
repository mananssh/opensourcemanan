"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { addComment, type CommentState } from "@/app/blog/engagement-actions";

function PostButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`mt-3 rounded-full bg-accent px-5 py-2 font-mono text-sm text-white transition-opacity hover:opacity-90 ${pending ? "cursor-wait opacity-60" : ""}`}
    >
      {pending ? "Posting…" : label}
    </button>
  );
}

/**
 * Comment box (client) — surfaces validation/rate-limit errors via useActionState
 * and clears the textarea after a successful post. Used both for top-level
 * comments and replies (pass parentId).
 */
export function CommentComposer({
  postId,
  slug,
  parentId,
  placeholder = "Add a comment…",
  label = "Post comment",
  onPosted,
}: {
  postId: string;
  slug: string;
  parentId?: string;
  placeholder?: string;
  label?: string;
  onPosted?: () => void;
}) {
  const [state, action] = useActionState<CommentState, FormData>(addComment, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      onPosted?.();
    }
  }, [state, onPosted]);

  return (
    <form ref={formRef} action={action} className="mt-4">
      <input type="hidden" name="postId" value={postId} />
      <input type="hidden" name="slug" value={slug} />
      {parentId && <input type="hidden" name="parentId" value={parentId} />}
      <textarea
        name="body"
        required
        rows={3}
        maxLength={4000}
        placeholder={placeholder}
        className="w-full rounded-md border border-rule bg-surface px-3 py-2 font-body text-ink transition-colors focus:border-accent"
      />
      {state.error && (
        <p role="alert" className="mt-2 font-mono text-xs text-accent">
          {state.error}
        </p>
      )}
      <PostButton label={label} />
    </form>
  );
}

"use client";

import { useOptimistic } from "react";
import { toggleReaction } from "@/app/blog/engagement-actions";

/**
 * Like toggle with optimistic UI — the heart + count update instantly, then the
 * server action persists and revalidates. Signed-out clicks redirect to sign-in.
 */
export function ReactionBar({
  postId,
  slug,
  count,
  reacted,
}: {
  postId: string;
  slug: string;
  count: number;
  reacted: boolean;
}) {
  const [opt, setOpt] = useOptimistic(
    { count, reacted },
    (_s, next: { count: number; reacted: boolean }) => next,
  );

  async function action(formData: FormData) {
    setOpt({
      count: opt.reacted ? opt.count - 1 : opt.count + 1,
      reacted: !opt.reacted,
    });
    await toggleReaction(formData);
  }

  return (
    <form action={action}>
      <input type="hidden" name="postId" value={postId} />
      <input type="hidden" name="slug" value={slug} />
      <button
        type="submit"
        aria-pressed={opt.reacted}
        aria-label={`${opt.count} like${opt.count === 1 ? "" : "s"}${opt.reacted ? " — you liked this, tap to remove" : " — like this post"}`}
        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 font-mono text-sm transition-colors ${
          opt.reacted
            ? "border-accent text-accent"
            : "border-rule text-muted hover:border-accent hover:text-accent"
        }`}
      >
        <span aria-hidden>{opt.reacted ? "♥" : "♡"}</span>
        <span className="tabular-nums" aria-hidden>
          {opt.count}
        </span>
      </button>
    </form>
  );
}

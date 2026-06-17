"use client";

import { useOptimistic } from "react";
import { toggleBookmark } from "@/app/blog/engagement-actions";

/** Save/unsave a post, optimistic. Signed-out clicks redirect to sign-in. */
export function BookmarkButton({
  postId,
  slug,
  bookmarked,
}: {
  postId: string;
  slug: string;
  bookmarked: boolean;
}) {
  const [opt, setOpt] = useOptimistic(bookmarked, (_s, next: boolean) => next);

  async function action(formData: FormData) {
    setOpt(!opt);
    await toggleBookmark(formData);
  }

  return (
    <form action={action}>
      <input type="hidden" name="postId" value={postId} />
      <input type="hidden" name="slug" value={slug} />
      <button
        type="submit"
        aria-pressed={opt}
        aria-label={opt ? "Remove bookmark" : "Save post"}
        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 font-mono text-sm transition-colors ${
          opt
            ? "border-accent text-accent"
            : "border-rule text-muted hover:border-accent hover:text-accent"
        }`}
      >
        <span aria-hidden>{opt ? "★" : "☆"}</span>
        {opt ? "Saved" : "Save"}
      </button>
    </form>
  );
}

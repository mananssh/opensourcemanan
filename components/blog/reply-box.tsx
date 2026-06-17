"use client";

import { useState } from "react";
import { CommentComposer } from "@/components/blog/comment-composer";

/** A "Reply" toggle that reveals a composer scoped to a parent comment. */
export function ReplyBox({
  postId,
  slug,
  parentId,
}: {
  postId: string;
  slug: string;
  parentId: string;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-1 font-mono text-[0.65rem] uppercase tracking-[0.1em] text-faint transition-colors hover:text-accent"
      >
        Reply
      </button>
    );
  }

  return (
    <div className="mt-2">
      <CommentComposer
        postId={postId}
        slug={slug}
        parentId={parentId}
        placeholder="Write a reply…"
        label="Reply"
        onPosted={() => setOpen(false)}
      />
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="mt-1 font-mono text-[0.65rem] uppercase tracking-[0.1em] text-faint transition-colors hover:text-accent"
      >
        Cancel
      </button>
    </div>
  );
}

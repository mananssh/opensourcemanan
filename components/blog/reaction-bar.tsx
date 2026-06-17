import { toggleReaction } from "@/app/blog/engagement-actions";
import { SubmitButton } from "@/components/blog/submit-button";

/** Like/clap toggle (server form). Clicking while signed-out redirects to sign-in. */
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
  return (
    <form action={toggleReaction}>
      <input type="hidden" name="postId" value={postId} />
      <input type="hidden" name="slug" value={slug} />
      <SubmitButton
        aria-pressed={reacted}
        aria-label={`${count} like${count === 1 ? "" : "s"}${reacted ? " — you liked this, tap to remove" : " — like this post"}`}
        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 font-mono text-sm transition-colors ${
          reacted
            ? "border-accent text-accent"
            : "border-rule text-muted hover:border-accent hover:text-accent"
        }`}
      >
        <span aria-hidden>{reacted ? "♥" : "♡"}</span>
        <span className="tabular-nums" aria-hidden>
          {count}
        </span>
      </SubmitButton>
    </form>
  );
}

import Link from "next/link";
import type { Session } from "next-auth";
import { addComment, deleteOwnComment } from "@/app/blog/engagement-actions";
import { SubmitButton } from "@/components/blog/submit-button";
import type { Comment } from "@/db/schema";

function fmt(d: Date): string {
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function CommentSection({
  postId,
  slug,
  comments,
  session,
}: {
  postId: string;
  slug: string;
  comments: Comment[];
  session: Session | null;
}) {
  const viewerEmail = session?.user?.email?.toLowerCase() ?? null;
  const isOwner = session?.user?.isOwner ?? false;
  const canDelete = (c: Comment) =>
    !!viewerEmail && (isOwner || c.userEmail.toLowerCase() === viewerEmail);

  return (
    <section className="mt-16 border-t border-rule pt-10">
      <p className="mb-6 font-mono text-xs uppercase tracking-[0.25em] text-faint">
        {comments.length} comment{comments.length === 1 ? "" : "s"}
      </p>

      {comments.length > 0 && (
        <ul className="space-y-6">
          {comments.map((c) => (
            <li key={c.id}>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-sm font-bold text-ink">
                  {c.userName}
                </span>
                <span className="font-mono text-[0.65rem] text-faint">
                  {fmt(c.createdAt)}
                </span>
                {canDelete(c) && (
                  <form action={deleteOwnComment} className="ml-auto">
                    <input type="hidden" name="commentId" value={c.id} />
                    <input type="hidden" name="slug" value={slug} />
                    <SubmitButton
                      className="font-mono text-[0.65rem] uppercase tracking-[0.1em] text-faint hover:text-accent"
                      pendingLabel="Deleting…"
                    >
                      Delete
                    </SubmitButton>
                  </form>
                )}
              </div>
              <p className="mt-1 whitespace-pre-wrap font-body text-muted">
                {c.body}
              </p>
            </li>
          ))}
        </ul>
      )}

      {session?.user ? (
        <form action={addComment} className="mt-8">
          <input type="hidden" name="postId" value={postId} />
          <input type="hidden" name="slug" value={slug} />
          <textarea
            name="body"
            required
            rows={3}
            maxLength={4000}
            placeholder="Add a comment…"
            className="w-full rounded-md border border-rule bg-surface px-3 py-2 font-body text-ink outline-none transition-colors focus:border-accent"
          />
          <SubmitButton
            className="mt-3 rounded-full bg-accent px-5 py-2 font-mono text-sm text-white transition-opacity hover:opacity-90"
            pendingLabel="Posting…"
          >
            Post comment
          </SubmitButton>
        </form>
      ) : (
        <p className="mt-8 font-mono text-sm text-faint">
          <Link
            href={`/sign-in?next=/blog/${slug}`}
            className="text-accent hover:underline"
          >
            Sign in
          </Link>{" "}
          to comment.
        </p>
      )}
    </section>
  );
}

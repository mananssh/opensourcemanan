import Link from "next/link";
import type { Session } from "next-auth";
import { deleteOwnComment } from "@/app/blog/engagement-actions";
import { SubmitButton } from "@/components/blog/submit-button";
import { CommentComposer } from "@/components/blog/comment-composer";
import { ReplyBox } from "@/components/blog/reply-box";
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

  // One level of threading: top-level comments + replies grouped by parentId.
  const roots = comments.filter((c) => !c.parentId);
  const repliesByParent = new Map<string, Comment[]>();
  for (const c of comments) {
    if (c.parentId) {
      const arr = repliesByParent.get(c.parentId) ?? [];
      arr.push(c);
      repliesByParent.set(c.parentId, arr);
    }
  }

  const CommentBody = ({ c }: { c: Comment }) => (
    <>
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
      <p className="mt-1 whitespace-pre-wrap font-body text-muted">{c.body}</p>
    </>
  );

  return (
    <section className="mt-16 border-t border-rule pt-10">
      <p className="mb-6 font-mono text-xs uppercase tracking-[0.25em] text-faint">
        {comments.length} comment{comments.length === 1 ? "" : "s"}
      </p>

      {roots.length > 0 && (
        <ul className="space-y-6">
          {roots.map((c) => (
            <li key={c.id}>
              <CommentBody c={c} />
              {session?.user && (
                <ReplyBox postId={postId} slug={slug} parentId={c.id} />
              )}
              {(repliesByParent.get(c.id) ?? []).length > 0 && (
                <ul className="mt-4 space-y-4 border-l border-rule pl-4">
                  {repliesByParent.get(c.id)!.map((r) => (
                    <li key={r.id}>
                      <CommentBody c={r} />
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}

      {session?.user ? (
        <CommentComposer postId={postId} slug={slug} />
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

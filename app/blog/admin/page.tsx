import Link from "next/link";
import {
  adminListPosts,
  adminListCategories,
  adminRecentComments,
  adminCountSubscribers,
} from "@/lib/blog/admin";
import { togglePublish, deleteComment, deletePost, deleteCategory } from "./actions";
import { toggleCommentVisibility } from "@/app/blog/engagement-actions";
import { SubmitButton } from "@/components/blog/submit-button";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";

const rowAction =
  "font-mono text-[0.7rem] uppercase tracking-[0.12em] text-muted transition-colors hover:text-accent";

export const metadata = { title: "Admin" };

const th = "py-2 text-left font-mono text-[0.65rem] uppercase tracking-[0.15em] text-faint";
const td = "py-3 align-top";

export default async function AdminDashboard() {
  const [posts, categories, comments, subscriberCount] = await Promise.all([
    adminListPosts(),
    adminListCategories(),
    adminRecentComments(),
    adminCountSubscribers(),
  ]);

  return (
    <div className="space-y-8">
      <p className="inline-flex rounded-full border border-rule bg-surface px-4 py-1.5 font-mono text-xs uppercase tracking-[0.15em] text-muted">
        {subscriberCount} newsletter subscriber{subscriberCount === 1 ? "" : "s"}
      </p>

      <section className="rounded-xl border border-rule bg-surface p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-ink">Posts</h2>
          <Link href="/blog/admin/posts/new" className="font-mono text-xs uppercase tracking-[0.15em] text-accent hover:underline">+ New</Link>
        </div>
        {posts.length === 0 ? (
          <p className="font-mono text-sm text-faint">No posts yet.</p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-rule">
                <th className={th}>Title</th>
                <th className={th}>Category</th>
                <th className={th}>Visibility</th>
                <th className={th}>Status</th>
                <th className={th}></th>
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => (
                <tr key={p.id} className="border-b border-rule">
                  <td className={td}>
                    <Link href={`/blog/admin/posts/${p.id}`} className="font-body text-ink hover:text-accent">
                      {p.title}
                    </Link>
                  </td>
                  <td className={`${td} font-mono text-xs text-muted`}>{p.categoryName ?? "—"}</td>
                  <td className={`${td} font-mono text-xs text-muted`}>{p.visibility}</td>
                  <td className={`${td} font-mono text-xs`}>
                    <span className={p.status === "published" ? "text-accent" : "text-faint"}>{p.status}</span>
                  </td>
                  <td className={`${td} text-right`}>
                    <div className="flex items-center justify-end gap-4">
                      <form action={togglePublish} className="inline">
                        <input type="hidden" name="id" value={p.id} />
                        <SubmitButton className={rowAction} pendingLabel="…">
                          {p.status === "published" ? "Unpublish" : "Publish"}
                        </SubmitButton>
                      </form>
                      <Link href={`/blog/admin/posts/${p.id}`} className={rowAction}>
                        Edit
                      </Link>
                      <form action={deletePost} className="inline">
                        <input type="hidden" name="id" value={p.id} />
                        <ConfirmSubmit
                          message={`Delete "${p.title}"? This can't be undone.`}
                          className={rowAction}
                          pendingLabel="…"
                        >
                          Delete
                        </ConfirmSubmit>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="rounded-xl border border-rule bg-surface p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-ink">Categories</h2>
          <Link href="/blog/admin/categories/new" className="font-mono text-xs uppercase tracking-[0.15em] text-accent hover:underline">+ New</Link>
        </div>
        {categories.length === 0 ? (
          <p className="font-mono text-sm text-faint">No categories yet.</p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-rule">
                <th className={th}>Name</th>
                <th className={th}>Visibility</th>
                <th className={th}>Order</th>
                <th className={th}></th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id} className="border-b border-rule">
                  <td className={td}>
                    <span className="mr-2 inline-block h-3 w-3 rounded-sm align-middle" style={{ backgroundColor: c.accentColor }} />
                    <Link href={`/blog/admin/categories/${c.id}`} className="font-body text-ink hover:text-accent">
                      {c.name}
                    </Link>
                  </td>
                  <td className={`${td} font-mono text-xs text-muted`}>{c.visibility}</td>
                  <td className={`${td} font-mono text-xs text-muted`}>{c.sortOrder}</td>
                  <td className={`${td} text-right`}>
                    <div className="flex items-center justify-end gap-4">
                      <Link href={`/blog/admin/categories/${c.id}`} className={rowAction}>
                        Edit
                      </Link>
                      <form action={deleteCategory} className="inline">
                        <input type="hidden" name="id" value={c.id} />
                        <ConfirmSubmit
                          message={`Delete category "${c.name}"? Posts keep their content but lose this category.`}
                          className={rowAction}
                          pendingLabel="…"
                        >
                          Delete
                        </ConfirmSubmit>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="rounded-xl border border-rule bg-surface p-6">
        <h2 className="mb-4 font-display text-xl font-bold text-ink">Comments</h2>
        {comments.length === 0 ? (
          <p className="font-mono text-sm text-faint">No comments yet.</p>
        ) : (
          <ul className="space-y-4">
            {comments.map((c) => (
              <li key={c.id} className="flex items-start justify-between gap-4 border-b border-rule pb-4">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-sm font-bold text-ink">{c.userName}</span>
                    <span className="font-mono text-[0.65rem] text-faint">on</span>
                    {c.postSlug ? (
                      <Link href={`/blog/${c.postSlug}`} className="font-mono text-[0.7rem] text-accent hover:underline">
                        {c.postTitle}
                      </Link>
                    ) : (
                      <span className="font-mono text-[0.7rem] text-faint">(deleted post)</span>
                    )}
                    {c.status === "hidden" && (
                      <span className="rounded-sm bg-accent-soft px-1.5 font-mono text-[0.6rem] uppercase tracking-[0.1em] text-accent">
                        hidden
                      </span>
                    )}
                  </div>
                  <p className="mt-1 whitespace-pre-wrap font-body text-sm text-muted">{c.body}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <form action={toggleCommentVisibility}>
                    <input type="hidden" name="commentId" value={c.id} />
                    {c.postSlug && <input type="hidden" name="slug" value={c.postSlug} />}
                    <SubmitButton
                      className="font-mono text-[0.7rem] uppercase tracking-[0.12em] text-muted hover:text-accent"
                      pendingLabel="…"
                    >
                      {c.status === "visible" ? "Hide" : "Show"}
                    </SubmitButton>
                  </form>
                  <form action={deleteComment}>
                    <input type="hidden" name="id" value={c.id} />
                    <SubmitButton
                      className="font-mono text-[0.7rem] uppercase tracking-[0.12em] text-muted hover:text-accent"
                      pendingLabel="…"
                    >
                      Delete
                    </SubmitButton>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

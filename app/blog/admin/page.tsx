import Link from "next/link";
import {
  adminListPosts,
  adminListCategories,
  adminRecentComments,
  adminCountSubscribers,
} from "@/lib/blog/admin";
import { togglePublish, deleteComment } from "./actions";

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
                    <form action={togglePublish} className="inline">
                      <input type="hidden" name="id" value={p.id} />
                      <button type="submit" className="font-mono text-[0.7rem] uppercase tracking-[0.12em] text-muted hover:text-accent">
                        {p.status === "published" ? "Unpublish" : "Publish"}
                      </button>
                    </form>
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
                  </div>
                  <p className="mt-1 whitespace-pre-wrap font-body text-sm text-muted">{c.body}</p>
                </div>
                <form action={deleteComment}>
                  <input type="hidden" name="id" value={c.id} />
                  <button type="submit" className="shrink-0 font-mono text-[0.7rem] uppercase tracking-[0.12em] text-muted hover:text-accent">
                    Delete
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

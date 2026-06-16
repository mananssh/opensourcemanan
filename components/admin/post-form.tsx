import { savePost, deletePost } from "@/app/blog/admin/actions";
import { ImageUpload } from "@/components/image-upload";
import { publicUrl } from "@/lib/storage/gcs";
import type { Post, Category } from "@/db/schema";

const labelCls =
  "mb-1.5 block font-mono text-[0.7rem] uppercase tracking-[0.15em] text-faint";
const inputCls =
  "w-full rounded-md border border-rule bg-surface px-3 py-2 font-body text-ink outline-none transition-colors focus:border-accent";

const VISIBILITY = ["public", "authed", "allowlist", "owner"] as const;

export function PostForm({
  post,
  categories,
}: {
  post?: Post;
  categories: Category[];
}) {
  return (
    <form action={savePost} className="max-w-2xl space-y-6">
      {post && <input type="hidden" name="id" value={post.id} />}

      <div>
        <label className={labelCls} htmlFor="title">Title</label>
        <input id="title" name="title" required defaultValue={post?.title} className={inputCls} />
      </div>

      <div>
        <label className={labelCls} htmlFor="slug">Slug</label>
        <input id="slug" name="slug" defaultValue={post?.slug} placeholder="auto from title" className={inputCls} />
      </div>

      <div>
        <label className={labelCls} htmlFor="excerpt">Excerpt</label>
        <textarea id="excerpt" name="excerpt" rows={2} defaultValue={post?.excerpt ?? ""} className={inputCls} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls} htmlFor="categoryId">Category</label>
          <select id="categoryId" name="categoryId" defaultValue={post?.categoryId ?? ""} className={inputCls}>
            <option value="">— none —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls} htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={post?.status ?? "draft"} className={inputCls}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls} htmlFor="visibility">Visibility</label>
          <select id="visibility" name="visibility" defaultValue={post?.visibility ?? "public"} className={inputCls}>
            {VISIBILITY.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls} htmlFor="allowedEmails">Allowed emails (for allowlist)</label>
          <input id="allowedEmails" name="allowedEmails" defaultValue={post?.allowedEmails.join(", ")} placeholder="a@x.com, b@y.com" className={inputCls} />
        </div>
      </div>

      <div>
        <label className={labelCls}>Cover image</label>
        <ImageUpload
          name="coverImageKey"
          initialKey={post?.coverImageKey}
          initialUrl={post?.coverImageKey ? publicUrl(post.coverImageKey) : null}
        />
      </div>

      <div>
        <label className={labelCls} htmlFor="bodyMdx">Body (MDX)</label>
        <textarea id="bodyMdx" name="bodyMdx" rows={18} defaultValue={post?.bodyMdx ?? ""} className={`${inputCls} font-mono text-sm`} />
      </div>

      <details className="rounded-md border border-rule p-3">
        <summary className="cursor-pointer font-mono text-[0.7rem] uppercase tracking-[0.15em] text-faint">SEO (optional)</summary>
        <div className="mt-4 space-y-4">
          <div>
            <label className={labelCls} htmlFor="metaTitle">Meta title</label>
            <input id="metaTitle" name="metaTitle" defaultValue={post?.metaTitle ?? ""} className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="metaDescription">Meta description</label>
            <textarea id="metaDescription" name="metaDescription" rows={2} defaultValue={post?.metaDescription ?? ""} className={inputCls} />
          </div>
        </div>
      </details>

      <div className="flex items-center gap-3">
        <button type="submit" className="rounded-full bg-accent px-5 py-2 font-mono text-sm text-white transition-opacity hover:opacity-90">
          Save
        </button>
        {post && (
          <button type="submit" formAction={deletePost} className="rounded-full border border-rule px-5 py-2 font-mono text-sm text-muted transition-colors hover:border-accent hover:text-accent">
            Delete
          </button>
        )}
      </div>
    </form>
  );
}
